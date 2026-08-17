<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Sale;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use App\Services\Hacienda\HaciendaApiClient;
use App\Services\Hacienda\HaciendaDocumentNumberService;
use App\Services\Hacienda\HaciendaXmlGenerator;
use App\Services\Hacienda\HaciendaXmlSigner;
use App\Services\Notifications\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly HaciendaDocumentNumberService $numberService,
        private readonly HaciendaXmlGenerator $xmlGenerator,
        private readonly HaciendaXmlSigner $xmlSigner,
        private readonly HaciendaApiClient $apiClient,
        private readonly WhatsAppService $whatsapp,
    )
    {
    }

    public function index(Request $request)
    {
        return Invoice::with(['sale', 'customer'])->latest()->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        $data = $request->validate([
            'sale_id' => ['required', 'exists:sales,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'document_type' => ['nullable', 'in:01,02,03,04,08,09,10'],
            'tax_id' => ['required', 'string', 'max:30'],
            'legal_name' => ['required', 'string', 'max:180'],
            'email' => ['nullable', 'email', 'max:180'],
            'metadata' => ['nullable', 'array'],
            'auto_process' => ['sometimes', 'boolean'],
        ]);
        $autoProcess = (bool) ($data['auto_process'] ?? false);
        unset($data['auto_process']);

        $sale = Sale::findOrFail($data['sale_id']);
        $documentType = $data['document_type'] ?? '01';

        if ($invoice = Invoice::where('sale_id', $sale->id)->where('document_type', $documentType)->first()) {
            return $invoice->load(['sale', 'customer']);
        }

        $fiscalNumber = $this->numberService->next($sale->branch_id, $documentType);

        $invoice = Invoice::create([
            ...$data,
            'customer_id' => $data['customer_id'] ?? $sale->customer_id,
            'folio' => $fiscalNumber['numero_consecutivo'],
            'document_type' => $documentType,
            'schema_version' => $fiscalNumber['schema_version'],
            'clave' => $fiscalNumber['clave'],
            'numero_consecutivo' => $fiscalNumber['numero_consecutivo'],
            'security_code' => $fiscalNumber['security_code'],
            'status' => 'generated',
            'hacienda_status' => 'pending_xml',
            'issued_at' => now(),
        ]);

        $invoice = $this->xmlGenerator->generate($invoice);

        $activityLogger->log($request->user(), 'invoice.created', $invoice, [
            'sale_id' => $invoice->sale_id,
            'document_type' => $invoice->document_type,
            'clave' => $invoice->clave,
            'hacienda_status' => $invoice->hacienda_status,
        ]);

        if ($autoProcess) {
            $invoice = $this->autoProcess($invoice, $request, $activityLogger);
        }

        return response()->json($invoice, 201);
    }

    public function generateXml(Request $request, Invoice $invoice, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hacienda.manage');

        $invoice = $this->xmlGenerator->generate($invoice);
        $activityLogger->log($request->user(), 'invoice.xml_generated', $invoice, ['clave' => $invoice->clave]);

        return $invoice;
    }

    public function sign(Request $request, Invoice $invoice, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hacienda.manage');

        $invoice = $this->xmlSigner->sign($invoice);
        $activityLogger->log($request->user(), 'invoice.signed', $invoice, ['clave' => $invoice->clave]);

        return $invoice;
    }

    public function submit(Request $request, Invoice $invoice, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hacienda.manage');

        $invoice = $this->apiClient->submit($invoice);
        $activityLogger->log($request->user(), 'invoice.submitted', $invoice, [
            'clave' => $invoice->clave,
            'hacienda_status' => $invoice->hacienda_status,
        ]);

        return $invoice;
    }

    public function checkStatus(Request $request, Invoice $invoice, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hacienda.manage');

        $invoice = $this->apiClient->checkStatus($invoice);
        $activityLogger->log($request->user(), 'invoice.status_checked', $invoice, [
            'clave' => $invoice->clave,
            'hacienda_status' => $invoice->hacienda_status,
        ]);

        return $invoice;
    }

    private function autoProcess(Invoice $invoice, Request $request, ActivityLogger $activityLogger): Invoice
    {
        $steps = ['xml' => 'done'];

        foreach ([
            'sign' => fn (Invoice $current) => $this->xmlSigner->sign($current),
            'submit' => fn (Invoice $current) => $this->apiClient->submit($current),
            'status' => fn (Invoice $current) => $this->apiClient->checkStatus($current),
        ] as $step => $handler) {
            try {
                $invoice = $handler($invoice);
                $steps[$step] = 'done';
                $activityLogger->log($request->user(), "invoice.{$step}_auto", $invoice, [
                    'clave' => $invoice->clave,
                    'hacienda_status' => $invoice->hacienda_status,
                ]);
            } catch (ValidationException $exception) {
                $steps[$step] = 'skipped';
                $invoice->update([
                    'metadata' => [
                        ...(array) $invoice->metadata,
                        'auto_process' => [
                            'steps' => $steps,
                            'message' => collect($exception->errors())->flatten()->first(),
                            'stopped_at' => $step,
                        ],
                    ],
                ]);

                $activityLogger->log($request->user(), 'invoice.auto_process_skipped', $invoice, [
                    'clave' => $invoice->clave,
                    'step' => $step,
                    'message' => collect($exception->errors())->flatten()->first(),
                ]);

                break;
            }
        }

        $invoice = $invoice->fresh(['sale', 'customer']);

        if (in_array($invoice->hacienda_status, ['accepted', 'aceptado'])) {
            $this->sendWhatsAppNotification($invoice);
        }

        return $invoice;
    }

    private function sendWhatsAppNotification(Invoice $invoice): void
    {
        try {
            $customer = $invoice->customer;
            $phone = $customer?->phone;

            if (! $phone) {
                return;
            }

            $this->whatsapp->sendInvoiceNotification(
                $phone,
                $customer->name,
                $invoice->numero_consecutivo,
                (float) ($invoice->sale->total ?? 0),
                null,
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('WhatsApp: Failed to send invoice notification', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
