<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OperationalModulesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private CashSession $session;

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

        $this->postJson('/api/cash-movements', [
            'cash_session_id' => $this->session->id,
            'type' => 'withdrawal',
            'amount' => 25,
            'reason' => 'Gasto menor',
        ])->assertCreated()->assertJsonPath('type', 'withdrawal');

        $this->assertSame('125.00', $this->session->fresh()->expected_amount);
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
        $sale = $this->sale();

        $this->postJson('/api/invoices', [
            'sale_id' => $sale->id,
            'tax_id' => 'XAXX010101000',
            'legal_name' => 'Publico General',
            'email' => 'facturas@example.com',
        ])->assertCreated()
            ->assertJsonPath('tax_id', 'XAXX010101000')
            ->assertJsonPath('status', 'issued');
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
}
