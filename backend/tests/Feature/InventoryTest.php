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

    public function test_product_can_be_created_with_auto_identifiers_and_deleted(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/products', [
            'name' => 'Producto Automatico',
            'cost_price' => 5,
            'sale_price' => 15,
            'tax_rate' => 13,
            'stock' => 10,
            'unit' => 'piece',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Producto Automatico')
            ->assertJsonPath('data.is_active', true);

        $this->assertNotEmpty($response->json('data.sku'));
        $this->assertNotEmpty($response->json('data.barcode'));

        $this->deleteJson('/api/products/' . $response->json('data.id'))->assertNoContent();

        $this->getJson('/api/products?per_page=100')
            ->assertOk()
            ->assertJsonMissing(['name' => 'Producto Automatico']);
    }

    public function test_product_identifiers_can_be_generated(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/products/identifiers')
            ->assertOk()
            ->assertJsonStructure(['sku', 'barcode']);
    }

    public function test_customer_can_be_created_updated_and_deleted(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $customerId = $this->postJson('/api/customers', [
            'name' => 'Cliente CRUD',
            'phone' => '8888-8888',
            'email' => 'cliente@example.com',
            'identification_type' => '01',
            'identification_number' => '101110111',
            'credit_limit' => 100,
        ])->assertCreated()
            ->assertJsonPath('name', 'Cliente CRUD')
            ->json('id');

        $this->putJson("/api/customers/{$customerId}", [
            'name' => 'Cliente Actualizado',
            'phone' => '7777-7777',
            'email' => 'cliente@example.com',
            'identification_type' => '01',
            'identification_number' => '101110111',
            'credit_limit' => 200,
        ])->assertOk()
            ->assertJsonPath('name', 'Cliente Actualizado')
            ->assertJsonPath('phone', '7777-7777');

        $this->deleteJson("/api/customers/{$customerId}")->assertNoContent();

        $this->getJson('/api/customers?per_page=100')
            ->assertOk()
            ->assertJsonMissing(['name' => 'Cliente Actualizado']);
    }
}
