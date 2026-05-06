<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_refund_restores_stock_and_marks_sale_refunded(): void
    {
        $branch = Branch::create(['name' => 'Principal', 'code' => 'MAIN']);
        $user = User::factory()->create(['branch_id' => $branch->id]);
        Sanctum::actingAs($user);

        $register = CashRegister::create(['branch_id' => $branch->id, 'name' => 'Caja 1', 'code' => 'C1']);
        $session = CashSession::create([
            'cash_register_id' => $register->id,
            'user_id' => $user->id,
            'opening_amount' => 100,
            'expected_amount' => 100,
            'opened_at' => now(),
        ]);

        $product = Product::create([
            'sku' => 'RF-1',
            'name' => 'Producto devolucion',
            'cost_price' => 10,
            'sale_price' => 50,
            'tax_rate' => 0,
            'stock' => 5,
            'unit' => 'piece',
        ]);

        $saleId = $this->postJson('/api/sales', [
            'cash_session_id' => $session->id,
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'payments' => [['method' => 'cash', 'amount' => 100]],
        ])->json('data.id');

        $this->assertSame('3.000', $product->fresh()->stock);

        $this->postJson('/api/refunds', [
            'sale_id' => $saleId,
            'reason' => 'Prueba de devolucion',
        ])->assertCreated();

        $this->assertSame('5.000', $product->fresh()->stock);
        $this->assertDatabaseHas('sales', ['id' => $saleId, 'status' => 'refunded']);
    }
}
