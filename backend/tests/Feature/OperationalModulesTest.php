<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\Customer;
use App\Models\HaciendaSetting;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Role;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OperationalModulesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private CashSession $session;
    private HaciendaSetting $haciendaSetting;

    protected function setUp(): void
    {
        parent::setUp();

        $branch = Branch::create(['name' => 'Principal', 'code' => 'MAIN']);
        $this->user = User::factory()->create(['branch_id' => $branch->id]);
        Sanctum::actingAs($this->user);

        $register = CashRegister::create(['branch_id' => $branch->id, 'name' => 'Caja 1', 'code' => 'C1']);
        $this->session = CashSession::create([
            'cash_register_id' => $register->id,
            'user_id' => $this->user->id,
            'opening_amount' => 100,
            'expected_amount' => 100,
            'opened_at' => now(),
        ]);

        $this->haciendaSetting = HaciendaSetting::create([
            'branch_id' => $branch->id,
            'environment' => 'staging',
            'legal_name' => 'POS Costa Rica SRL',
            'identification_type' => '02',
            'identification_number' => '3101123456',
            'economic_activity_code' => '521101',
            'province' => '1',
            'canton' => '01',
            'district' => '01',
            'other_signs' => 'San Jose',
            'email' => 'facturas@example.com',
            'branch_code' => '001',
            'terminal_code' => '00001',
            'api_username' => 'cpf-02-3101123456@comprobanteselectronicos.go.cr',
            'api_password' => 'atv-password',
            'is_active' => true,
        ]);
    }

    public function test_cash_deposit_and_withdrawal_update_expected_amount(): void
    {
        $this->postJson('/api/cash-movements', [
            'cash_session_id' => $this->session->id,
            'type' => 'deposit',
            'amount' => 50,
            'reason' => 'Fondo adicional',
        ])->assertCreated()->assertJsonPath('type', 'deposit');

        $this->assertSame('150.00', $this->session->fresh()->expected_amount);
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'cash_movement.created',
            'subject_type' => CashMovement::class,
        ]);

        $this->postJson('/api/cash-movements', [
            'cash_session_id' => $this->session->id,
            'type' => 'withdrawal',
            'amount' => 25,
            'reason' => 'Gasto menor',
        ])->assertCreated()->assertJsonPath('type', 'withdrawal');

        $this->assertSame('125.00', $this->session->fresh()->expected_amount);
    }

    public function test_role_without_permission_cannot_run_restricted_action(): void
    {
        $role = Role::create(['name' => 'solo_lectura', 'display_name' => 'Solo lectura']);
        $restrictedUser = User::factory()->create([
            'branch_id' => $this->user->branch_id,
            'role_id' => $role->id,
        ]);

        Sanctum::actingAs($restrictedUser);

        $this->postJson('/api/backups')->assertForbidden();
    }

    public function test_cash_session_summary_returns_arqueo_totals(): void
    {
        $product = $this->product(['sale_price' => 50, 'tax_rate' => 0, 'stock' => 5]);

        $this->postJson('/api/cash-movements', [
            'cash_session_id' => $this->session->id,
            'type' => 'deposit',
            'amount' => 20,
            'reason' => 'Fondo adicional',
        ])->assertCreated();

        $this->postJson('/api/sales', [
            'cash_session_id' => $this->session->id,
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'payments' => [['method' => 'cash', 'amount' => 100]],
        ])->assertCreated();

        $this->getJson("/api/cash-sessions/{$this->session->id}/summary")
            ->assertOk()
            ->assertJsonPath('sales_count', 1)
            ->assertJsonPath('gross_sales', '100.00')
            ->assertJsonPath('opening_amount', '100.00')
            ->assertJsonPath('expected_amount', '220.00')
            ->assertJsonPath('cash_deposits', '20.00')
            ->assertJsonPath('cash_withdrawals', '0.00')
            ->assertJsonPath('payments.0.method', 'cash')
            ->assertJsonPath('payments.0.total', '100.00');
    }

    public function test_cash_session_opening_requires_shift_supervisor_and_returns_summary(): void
    {
        $register = CashRegister::create(['branch_id' => $this->user->branch_id, 'name' => 'Caja 2', 'code' => 'C2']);

        $this->session->update(['status' => 'closed', 'closed_at' => now()]);

        $this->getJson('/api/cash-registers')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Caja 2']);

        $this->postJson('/api/cash-sessions/open', [
            'cash_register_id' => $register->id,
            'opening_amount' => 50000,
            'shift' => 'Mañana',
            'supervisor_name' => 'Carlos Ramírez',
            'notes' => 'Supervisor confirma monto presencialmente.',
        ])->assertCreated()
            ->assertJsonPath('opening_amount', '50000.00')
            ->assertJsonPath('shift', 'Mañana')
            ->assertJsonPath('supervisor_name', 'Carlos Ramírez')
            ->assertJsonPath('cash_register.name', 'Caja 2')
            ->assertJsonPath('user.id', $this->user->id);
    }

    public function test_backup_can_be_created_listed_and_deleted(): void
    {
        File::deleteDirectory(storage_path('app/backups'));
        $product = $this->product(['name' => 'Producto respaldado', 'stock' => 12]);

        $backup = $this->postJson('/api/backups')
            ->assertCreated()
            ->assertJsonStructure(['name', 'size', 'created_at'])
            ->json('name');

        $this->getJson('/api/backups')
            ->assertOk()
            ->assertJsonStructure(['data', 'schedule'])
            ->assertJsonFragment(['name' => $backup]);

        $this->postJson("/api/backups/{$backup}/verify")
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('has_database', true);

        $product->update(['name' => 'Producto modificado', 'stock' => 1]);

        $this->postJson("/api/backups/{$backup}/restore")
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('name', $backup);

        $this->assertDatabaseHas('products', [
            'sku' => $product->sku,
            'name' => 'Producto respaldado',
            'stock' => 12,
        ]);

        $this->postJson('/api/backups/schedule', [
            'enabled' => true,
            'frequency' => 'daily',
            'time' => now()->format('H:i'),
            'retention' => 30,
        ])->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('command', 'php artisan backups:run-scheduled');

        $this->assertSame(0, Artisan::call('backups:run-scheduled'));
        $this->assertStringContainsString('Respaldo programado creado:', Artisan::output());

        $this->deleteJson("/api/backups/{$backup}")
            ->assertNoContent();

        $this->getJson('/api/backups')
            ->assertOk()
            ->assertJsonMissing(['name' => $backup]);
    }

    public function test_admin_dashboard_roles_and_audit_are_available(): void
    {
        $this->seed();

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonStructure(['sales_today', 'gross_today', 'open_cash_sessions', 'low_stock', 'pending_hacienda']);

        $roles = $this->getJson('/api/admin/roles')
            ->assertOk()
            ->json();

        $permission = $this->getJson('/api/admin/permissions')
            ->assertOk()
            ->json('0');

        $this->putJson('/api/admin/roles/' . $roles[0]['id'], [
            'permissions' => [$permission['id']],
        ])->assertOk()
            ->assertJsonPath('permissions.0.id', $permission['id']);

        $this->getJson('/api/activity-logs')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_end_to_end_pos_day_flow_open_sell_invoice_and_close(): void
    {
        Storage::fake('local');
        $this->session->update(['status' => 'closed', 'closed_at' => now()]);
        $register = CashRegister::create(['branch_id' => $this->user->branch_id, 'name' => 'Caja E2E', 'code' => 'E2E']);
        $product = $this->product(['sale_price' => 100, 'tax_rate' => 13, 'stock' => 10]);

        $session = $this->postJson('/api/cash-sessions/open', [
            'cash_register_id' => $register->id,
            'opening_amount' => 50000,
            'shift' => 'Mañana',
            'supervisor_name' => 'Supervisor E2E',
        ])->assertCreated()
            ->assertJsonPath('status', 'open')
            ->json();

        $sale = $this->postJson('/api/sales', [
            'cash_session_id' => $session['id'],
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'payments' => [['method' => 'cash', 'amount' => 226]],
        ])->assertCreated()
            ->assertJsonPath('data.total', '226.00')
            ->json('data');

        $invoice = $this->postJson('/api/invoices', [
            'sale_id' => $sale['id'],
            'tax_id' => '3101123456',
            'legal_name' => 'Cliente E2E SRL',
            'email' => 'e2e@example.com',
            'auto_process' => true,
        ])->assertCreated()
            ->assertJsonPath('hacienda_status', 'xml_generated')
            ->json();

        Storage::disk('local')->assertExists($invoice['xml_path']);

        $this->postJson("/api/cash-sessions/{$session['id']}/close", [
            'closing_amount' => 50226,
            'notes' => 'Cierre E2E',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['hacienda']);

        \App\Models\Invoice::findOrFail($invoice['id'])->update(['hacienda_status' => 'accepted', 'status' => 'accepted']);

        $this->postJson("/api/cash-sessions/{$session['id']}/close", [
            'closing_amount' => 50226,
            'notes' => 'Cierre E2E aceptado',
        ])->assertOk()
            ->assertJsonPath('status', 'closed')
            ->assertJsonPath('difference_amount', '0.00');
    }

    public function test_payment_methods_can_be_created_and_updated(): void
    {
        $methodId = $this->postJson('/api/payment-methods', [
            'code' => 'voucher',
            'name' => 'Vale',
            'type' => 'other',
            'requires_reference' => true,
        ])->assertCreated()
            ->assertJsonPath('code', 'voucher')
            ->json('id');

        $this->putJson("/api/payment-methods/{$methodId}", [
            'name' => 'Vale autorizado',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('name', 'Vale autorizado')
            ->assertJsonPath('is_active', false);
    }

    public function test_branch_can_be_created_updated_listed_and_deleted(): void
    {
        $branchId = $this->postJson('/api/branches', [
            'name' => 'Sucursal Norte',
            'code' => 'NORTE',
            'phone' => '2222-2222',
            'email' => 'norte@example.com',
            'address' => 'Zona norte',
        ])->assertCreated()
            ->assertJsonPath('name', 'Sucursal Norte')
            ->assertJsonPath('code', 'NORTE')
            ->json('id');

        $this->getJson('/api/branches?per_page=100')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Sucursal Norte']);

        $this->putJson("/api/branches/{$branchId}", [
            'name' => 'Sucursal Norte Actualizada',
            'code' => 'NORTE',
            'phone' => '2222-3333',
            'email' => 'norte@example.com',
            'address' => 'Zona norte actualizada',
            'is_active' => true,
        ])->assertOk()
            ->assertJsonPath('name', 'Sucursal Norte Actualizada')
            ->assertJsonPath('phone', '2222-3333');

        $this->deleteJson("/api/branches/{$branchId}")->assertNoContent();

        $this->getJson('/api/branches?per_page=100')
            ->assertOk()
            ->assertJsonMissing(['name' => 'Sucursal Norte Actualizada']);
    }

    public function test_promotion_code_applies_discount_to_sale(): void
    {
        $product = $this->product(['sale_price' => 100, 'stock' => 5]);

        Promotion::create([
            'name' => 'Promo 10',
            'code' => 'PROMO10',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'min_sale_amount' => 0,
            'is_active' => true,
        ]);

        $this->postJson('/api/sales', [
            'cash_session_id' => $this->session->id,
            'promotion_code' => 'PROMO10',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'payments' => [['method' => 'cash', 'amount' => 90]],
        ])->assertCreated()
            ->assertJsonPath('data.discount_total', '10.00')
            ->assertJsonPath('data.total', '90.00');
    }

    public function test_credit_sale_increases_customer_balance_without_cash_drawer_increment(): void
    {
        $customer = Customer::create(['name' => 'Cliente credito']);
        $product = $this->product(['sale_price' => 80, 'stock' => 5]);

        $this->postJson('/api/sales', [
            'cash_session_id' => $this->session->id,
            'customer_id' => $customer->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'payments' => [['method' => 'credit', 'amount' => 80]],
        ])->assertCreated()
            ->assertJsonPath('data.total', '80.00');

        $this->assertSame('80.00', $customer->fresh()->balance);
        $this->assertSame('100.00', $this->session->fresh()->expected_amount);
    }

    public function test_credit_payment_reduces_customer_balance_and_updates_cash_when_cash_method(): void
    {
        $customer = Customer::create(['name' => 'Cliente con saldo', 'balance' => 120]);

        $this->postJson('/api/credit-payments', [
            'customer_id' => $customer->id,
            'cash_session_id' => $this->session->id,
            'method' => 'cash',
            'amount' => 70,
        ])->assertCreated()
            ->assertJsonPath('amount', '70.00');

        $this->assertSame('50.00', $customer->fresh()->balance);
        $this->assertSame('170.00', $this->session->fresh()->expected_amount);
    }

    public function test_invoice_can_be_created_for_sale(): void
    {
        Storage::fake('local');

        $sale = $this->sale();

        $response = $this->postJson('/api/invoices', [
            'sale_id' => $sale->id,
            'tax_id' => 'XAXX010101000',
            'legal_name' => 'Publico General',
            'email' => 'facturas@example.com',
        ])->assertCreated()
            ->assertJsonPath('tax_id', 'XAXX010101000')
            ->assertJsonPath('document_type', '01')
            ->assertJsonPath('schema_version', '4.4')
            ->assertJsonPath('status', 'xml_generated')
            ->assertJsonPath('hacienda_status', 'xml_generated');

        $this->assertDatabaseHas('invoices', [
            'sale_id' => $sale->id,
            'numero_consecutivo' => '00100001010000000001',
        ]);

        Storage::disk('local')->assertExists($response->json('xml_path'));
        $xml = Storage::disk('local')->get($response->json('xml_path'));

        $this->assertStringContainsString('<FacturaElectronica', $xml);
        $this->assertStringContainsString('<Clave>' . $response->json('clave') . '</Clave>', $xml);
        $this->assertStringContainsString('<NumeroConsecutivo>00100001010000000001</NumeroConsecutivo>', $xml);
    }

    public function test_invoice_auto_process_stops_cleanly_when_certificate_is_missing(): void
    {
        Storage::fake('local');
        $sale = $this->sale();

        $response = $this->postJson('/api/invoices', [
            'sale_id' => $sale->id,
            'tax_id' => '3101123456',
            'legal_name' => 'Cliente Auto SRL',
            'email' => 'auto@example.com',
            'auto_process' => true,
        ])->assertCreated()
            ->assertJsonPath('status', 'xml_generated')
            ->assertJsonPath('hacienda_status', 'xml_generated')
            ->assertJsonPath('metadata.auto_process.stopped_at', 'sign');

        Storage::disk('local')->assertExists($response->json('xml_path'));
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'invoice.auto_process_skipped',
            'subject_id' => $response->json('id'),
        ]);
    }

    public function test_hacienda_xml_can_be_created_for_all_supported_document_types(): void
    {
        Storage::fake('local');

        $documents = [
            ['type' => '01', 'root' => 'FacturaElectronica'],
            ['type' => '02', 'root' => 'NotaDebitoElectronica'],
            ['type' => '03', 'root' => 'NotaCreditoElectronica'],
            ['type' => '04', 'root' => 'TiqueteElectronico'],
            ['type' => '08', 'root' => 'FacturaElectronicaCompra'],
            ['type' => '09', 'root' => 'FacturaElectronicaExportacion'],
            ['type' => '10', 'root' => 'ReciboElectronicoPago'],
        ];

        foreach ($documents as $document) {
            $documentType = $document['type'];
            $root = $document['root'];
            $sale = $this->sale();

            $response = $this->postJson('/api/invoices', [
                'sale_id' => $sale->id,
                'document_type' => $documentType,
                'tax_id' => '3101123456',
                'legal_name' => "Cliente {$documentType}",
                'email' => 'documentos@example.com',
                'metadata' => [
                    'reference_number' => '00100001010000000001',
                    'reference_document_type' => '01',
                    'reference_code' => '01',
                    'reference_reason' => 'Prueba de documento asociado',
                ],
            ])->assertCreated()
                ->assertJsonPath('hacienda_status', 'xml_generated');

            $this->assertSame($documentType, (string) $response->json('document_type'));

            $xml = Storage::disk('local')->get($response->json('xml_path'));
            $this->assertStringContainsString("<{$root}", $xml);
            $this->assertStringContainsString("<NumeroConsecutivo>00100001{$documentType}", $xml);

            if (in_array($documentType, ['02', '03', '10'], true)) {
                $this->assertStringContainsString('<InformacionReferencia>', $xml);
                $this->assertStringContainsString('<Numero>00100001010000000001</Numero>', $xml);
            }
        }
    }

    public function test_invoice_xml_can_be_signed_with_configured_certificate(): void
    {
        Storage::fake('local');
        $this->storeTestCertificate('1234');

        $sale = $this->sale();

        $invoice = $this->postJson('/api/invoices', [
            'sale_id' => $sale->id,
            'tax_id' => '3101123456',
            'legal_name' => 'Cliente Firma SRL',
            'email' => 'firma@example.com',
        ])->assertCreated()->json();

        $response = $this->postJson("/api/invoices/{$invoice['id']}/sign")
            ->assertOk()
            ->assertJsonPath('status', 'signed')
            ->assertJsonPath('hacienda_status', 'signed');

        Storage::disk('local')->assertExists($response->json('signed_xml_path'));
        $signedXml = Storage::disk('local')->get($response->json('signed_xml_path'));

        $this->assertStringContainsString('<ds:Signature', $signedXml);
        $this->assertStringContainsString('<ds:SignatureValue>', $signedXml);
        $this->assertStringContainsString('<ds:X509Certificate>', $signedXml);
    }

    public function test_signed_invoice_can_be_submitted_and_status_checked(): void
    {
        Storage::fake('local');
        Http::fake([
            'idp.comprobanteselectronicos.go.cr/*' => Http::response(['access_token' => 'token-123'], 200),
            'api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/recepcion' => Http::response('', 201, [
                'Location' => 'https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/recepcion/clave-test',
            ]),
            'api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/recepcion/*' => Http::response([
                'clave' => 'clave-test',
                'fecha' => now()->format('Y-m-d\TH:i:sO'),
                'ind-estado' => 'aceptado',
                'respuesta-xml' => base64_encode('<MensajeHacienda />'),
            ], 200),
        ]);
        $this->storeTestCertificate('1234');

        $sale = $this->sale();
        $invoice = $this->postJson('/api/invoices', [
            'sale_id' => $sale->id,
            'tax_id' => '3101123456',
            'legal_name' => 'Cliente Envio SRL',
            'email' => 'envio@example.com',
        ])->assertCreated()->json();

        $signed = $this->postJson("/api/invoices/{$invoice['id']}/sign")
            ->assertOk()
            ->json();

        $this->postJson("/api/invoices/{$signed['id']}/submit")
            ->assertOk()
            ->assertJsonPath('status', 'submitted')
            ->assertJsonPath('hacienda_status', 'submitted');

        $response = $this->postJson("/api/invoices/{$signed['id']}/status")
            ->assertOk()
            ->assertJsonPath('status', 'accepted')
            ->assertJsonPath('hacienda_status', 'accepted');

        Storage::disk('local')->assertExists($response->json('hacienda_response_path'));

        Http::assertSent(fn ($request) => $request->url() === config('services.hacienda.token_url')
            && $request['grant_type'] === 'password'
            && $request['client_id'] === 'api-stag');
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/recepcion')
            && $request['clave'] === $signed['clave']
            && isset($request['comprobanteXml']));
    }

    public function test_barcode_can_be_generated_and_assigned_to_product(): void
    {
        $product = $this->product(['barcode' => null]);

        $barcode = $this->getJson('/api/barcodes/generate')
            ->assertOk()
            ->json('barcode');

        $this->postJson("/api/products/{$product->id}/barcode", [
            'barcode' => $barcode,
        ])->assertOk()
            ->assertJsonPath('barcode', $barcode);

        $this->assertSame($barcode, $product->fresh()->barcode);
    }

    private function product(array $overrides = []): Product
    {
        return Product::create([
            'sku' => $overrides['sku'] ?? 'P-' . uniqid(),
            'barcode' => $overrides['barcode'] ?? null,
            'name' => $overrides['name'] ?? 'Producto prueba',
            'cost_price' => $overrides['cost_price'] ?? 10,
            'sale_price' => $overrides['sale_price'] ?? 20,
            'tax_rate' => $overrides['tax_rate'] ?? 0,
            'stock' => $overrides['stock'] ?? 10,
            'unit' => 'piece',
        ]);
    }

    private function sale(): Sale
    {
        $product = $this->product(['sale_price' => 40, 'stock' => 5]);

        $saleId = $this->postJson('/api/sales', [
            'cash_session_id' => $this->session->id,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'payments' => [['method' => 'cash', 'amount' => 40]],
        ])->assertCreated()->json('data.id');

        return Sale::findOrFail($saleId);
    }

    private function storeTestCertificate(string $pin): void
    {
        $opensslConfig = $this->writeOpenSslConfig();
        $config = ['config' => $opensslConfig, 'digest_alg' => 'sha256'];
        $privateKey = openssl_pkey_new([
            'private_key_bits' => 2048,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
            'config' => $opensslConfig,
        ]);
        $csr = openssl_csr_new(['commonName' => 'POS Test Certificate'], $privateKey, $config);
        $certificate = openssl_csr_sign($csr, null, $privateKey, 1, $config);
        openssl_pkcs12_export($certificate, $p12, $privateKey, $pin);

        Storage::disk('local')->put('hacienda/certs/test.p12', $p12);
        $this->haciendaSetting->update([
            'certificate_path' => 'hacienda/certs/test.p12',
            'certificate_pin' => $pin,
        ]);
    }

    private function writeOpenSslConfig(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'openssl-test-');
        file_put_contents($path, implode(PHP_EOL, [
            '[ req ]',
            'distinguished_name = req_distinguished_name',
            'prompt = no',
            '[ req_distinguished_name ]',
            'CN = POS Test Certificate',
        ]));

        return $path;
    }
}
