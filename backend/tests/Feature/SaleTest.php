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

class SaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_decreases_stock_and_records_payment(): void
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
            'sku' => 'SALE-1',
            'name' => 'Producto Venta',
            'cost_price' => 10,
            'sale_price' => 50,
            'tax_rate' => 0,
            'stock' => 5,
            'unit' => 'piece',
        ]);

        $this->postJson('/api/sales', [
            'cash_session_id' => $session->id,
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'payments' => [['method' => 'cash', 'amount' => 100]],
        ])->assertCreated()->assertJsonPath('data.total', '100.00');

        $this->assertSame('3.000', $product->fresh()->stock);
    }
}
