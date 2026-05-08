<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Sale;
use App\Services\Hacienda\HaciendaApiClient;
use App\Services\Hacienda\HaciendaDocumentNumberService;
use App\Services\Hacienda\HaciendaXmlGenerator;
use App\Services\Hacienda\HaciendaXmlSigner;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly HaciendaDocumentNumberService $numberService,
        private readonly HaciendaXmlGenerator $xmlGenerator,
        private readonly HaciendaXmlSigner $xmlSigner,
        private readonly HaciendaApiClient $apiClient,
    )
    {
    }

    public function index(Request $request)
    {
        return Invoice::with(['sale', 'customer'])->latest()->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sale_id' => ['required', 'exists:sales,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'document_type' => ['nullable', 'in:01,04'],
            'tax_id' => ['required', 'string', 'max:30'],
            'legal_name' => ['required', 'string', 'max:180'],
            'email' => ['nullable', 'email', 'max:180'],
            'metadata' => ['nullable', 'array'],
        ]);

        $sale = Sale::findOrFail($data['sale_id']);

        if ($invoice = Invoice::where('sale_id', $sale->id)->first()) {
            return $invoice->load(['sale', 'customer']);
        }

        $documentType = $data['document_type'] ?? '01';
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

        return response()->json($this->xmlGenerator->generate($invoice), 201);
    }

    public function generateXml(Invoice $invoice)
    {
        return $this->xmlGenerator->generate($invoice);
    }

    public function sign(Invoice $invoice)
    {
        return $this->xmlSigner->sign($invoice);
    }

    public function submit(Invoice $invoice)
    {
        return $this->apiClient->submit($invoice);
    }

    public function checkStatus(Invoice $invoice)
    {
        return $this->apiClient->checkStatus($invoice);
    }
}
