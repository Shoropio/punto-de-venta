<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_movement_updates_stock(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $product = Product::create([
            'sku' => 'TEST-1',
            'name' => 'Producto Test',
            'cost_price' => 10,
            'sale_price' => 20,
            'tax_rate' => 0,
            'stock' => 5,
            'unit' => 'piece',
        ]);

        $this->postJson('/api/stock-movements', [
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => 3,
        ])->assertCreated();

        $this->assertSame('8.000', $product->fresh()->stock);
    }
}
