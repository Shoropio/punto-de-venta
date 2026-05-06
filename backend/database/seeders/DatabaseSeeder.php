<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Brand;
use App\Models\CashRegister;
use App\Models\Category;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $permissions = collect([
            ['name' => 'pos.sell', 'module' => 'pos', 'description' => 'Crear ventas'],
            ['name' => 'inventory.manage', 'module' => 'inventory', 'description' => 'Gestionar inventario'],
            ['name' => 'reports.view', 'module' => 'reports', 'description' => 'Ver reportes'],
            ['name' => 'settings.manage', 'module' => 'settings', 'description' => 'Administrar configuracion'],
        ])->map(fn ($permission) => Permission::firstOrCreate(['name' => $permission['name']], $permission));

        $admin = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrador']);
        $manager = Role::firstOrCreate(['name' => 'gerente'], ['display_name' => 'Gerente']);
        $cashier = Role::firstOrCreate(['name' => 'cajero'], ['display_name' => 'Cajero']);

        $admin->permissions()->sync($permissions->pluck('id'));
        $manager->permissions()->sync($permissions->whereIn('module', ['pos', 'inventory', 'reports'])->pluck('id'));
        $cashier->permissions()->sync($permissions->where('module', 'pos')->pluck('id'));

        $branch = Branch::firstOrCreate(['code' => 'MAIN'], ['name' => 'Sucursal Principal']);
        CashRegister::firstOrCreate(['code' => 'CAJA-01'], ['branch_id' => $branch->id, 'name' => 'Caja 01']);

        User::factory()->create([
            'name' => 'Admin POS',
            'email' => 'admin@example.com',
            'role_id' => $admin->id,
            'branch_id' => $branch->id,
            'password' => 'password',
        ]);

        $category = Category::firstOrCreate(['slug' => 'general'], ['name' => 'General']);
        $brand = Brand::firstOrCreate(['name' => 'Marca Generica']);

        Product::firstOrCreate(['sku' => 'SKU-CAFE-001'], [
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'barcode' => '750000000001',
            'name' => 'Cafe Americano',
            'cost_price' => 12,
            'sale_price' => 28,
            'tax_rate' => 16,
            'stock' => 100,
            'min_stock' => 10,
            'unit' => 'piece',
        ]);
    }
}
