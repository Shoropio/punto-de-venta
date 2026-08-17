<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Brand;
use App\Models\CashRegister;
use App\Models\Category;
use App\Models\Permission;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Role;
use App\Models\Supplier;
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
            ['name' => 'sales.cancel', 'module' => 'sales', 'description' => 'Anular ventas'],
            ['name' => 'refunds.create', 'module' => 'sales', 'description' => 'Registrar devoluciones'],
            ['name' => 'cash.open', 'module' => 'cash', 'description' => 'Abrir caja'],
            ['name' => 'cash.close', 'module' => 'cash', 'description' => 'Cerrar caja'],
            ['name' => 'cash.move', 'module' => 'cash', 'description' => 'Registrar depositos y retiros'],
            ['name' => 'inventory.manage', 'module' => 'inventory', 'description' => 'Gestionar inventario'],
            ['name' => 'products.delete', 'module' => 'inventory', 'description' => 'Eliminar productos'],
            ['name' => 'reports.view', 'module' => 'reports', 'description' => 'Ver reportes'],
            ['name' => 'hacienda.manage', 'module' => 'hacienda', 'description' => 'Gestionar Hacienda'],
            ['name' => 'backups.manage', 'module' => 'settings', 'description' => 'Gestionar respaldos'],
            ['name' => 'settings.manage', 'module' => 'settings', 'description' => 'Administrar configuracion'],
            ['name' => 'accounting.manage', 'module' => 'accounting', 'description' => 'Gestionar contabilidad y bancos'],
            ['name' => 'hr.manage', 'module' => 'hr', 'description' => 'Gestionar empleados y asistencia'],
        ])->map(fn ($permission) => Permission::firstOrCreate(['name' => $permission['name']], $permission));

        $admin = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Administrador']);
        $manager = Role::firstOrCreate(['name' => 'gerente'], ['display_name' => 'Gerente']);
        $cashier = Role::firstOrCreate(['name' => 'cajero'], ['display_name' => 'Cajero']);
        $accountant = Role::firstOrCreate(['name' => 'contador'], ['display_name' => 'Contador']);
        $hr = Role::firstOrCreate(['name' => 'rrhh'], ['display_name' => 'Recursos Humanos']);

        $admin->permissions()->sync($permissions->pluck('id'));
        $manager->permissions()->sync($permissions->whereIn('module', ['pos', 'sales', 'cash', 'inventory', 'reports'])->pluck('id'));
        $cashier->permissions()->sync($permissions->whereIn('name', ['pos.sell', 'cash.open'])->pluck('id'));
        $accountant->permissions()->sync($permissions->whereIn('module', ['accounting', 'hacienda', 'reports'])->pluck('id'));
        $hr->permissions()->sync($permissions->whereIn('module', ['hr'])->pluck('id'));

        $branch = Branch::firstOrCreate(['code' => 'MAIN'], ['name' => 'Sucursal Principal']);
        CashRegister::firstOrCreate(['code' => 'CAJA-01'], ['branch_id' => $branch->id, 'name' => 'Caja 01']);

        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin POS',
                'role_id' => $admin->id,
                'branch_id' => $branch->id,
                'password' => 'password',
                'is_active' => true,
            ],
        );

        $category = Category::firstOrCreate(['slug' => 'general'], ['name' => 'General']);
        $brand = Brand::firstOrCreate(['name' => 'Marca Generica']);
        $supplier = Supplier::firstOrCreate(['name' => 'Proveedor General'], [
            'phone' => '2222-0000',
            'email' => 'proveedor@example.com',
        ]);

        collect([
            ['code' => 'cash', 'name' => 'Efectivo', 'type' => 'cash', 'affects_cash_drawer' => true, 'sort_order' => 1],
            ['code' => 'card', 'name' => 'Tarjeta', 'type' => 'card', 'requires_reference' => true, 'sort_order' => 2],
            ['code' => 'transfer', 'name' => 'Transferencia', 'type' => 'transfer', 'requires_reference' => true, 'sort_order' => 3],
            ['code' => 'sinpe', 'name' => 'SINPE', 'type' => 'transfer', 'requires_reference' => true, 'sort_order' => 4],
            ['code' => 'credit', 'name' => 'Credito de cliente', 'type' => 'credit', 'sort_order' => 5],
        ])->each(fn ($method) => PaymentMethod::updateOrCreate(['code' => $method['code']], $method));

        Promotion::firstOrCreate(['code' => 'BIENVENIDA10'], [
            'name' => 'Bienvenida 10%',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'min_sale_amount' => 100,
            'is_active' => true,
        ]);

        $categories = collect(['Bebidas', 'Panaderia', 'Abarrotes', 'Lacteos', 'Limpieza', 'Snacks', 'Congelados', 'Cuidado personal'])
            ->mapWithKeys(fn ($name) => [$name => Category::firstOrCreate(['slug' => str($name)->slug()->toString()], ['name' => $name])]);

        $brands = collect(['Shoropio', 'La Finca', 'Tico Fresh', 'Del Sur', 'Casa Limpia', 'Natura'])
            ->mapWithKeys(fn ($name) => [$name => Brand::firstOrCreate(['name' => $name])]);

        $products = [
            ['SKU-CAFE-001', 'Cafe Americano', 'Bebidas', 'Shoropio', 12, 28, 100, 10, '750100000001'],
            ['SKU-CAPU-002', 'Capuchino', 'Bebidas', 'Shoropio', 18, 42, 80, 8, '750100000002'],
            ['SKU-TE-003', 'Te frio limon', 'Bebidas', 'Tico Fresh', 10, 25, 90, 12, '750100000003'],
            ['SKU-AGUA-004', 'Agua 600ml', 'Bebidas', 'Tico Fresh', 7, 18, 150, 20, '750100000004'],
            ['SKU-JUGO-005', 'Jugo naranja 1L', 'Bebidas', 'Tico Fresh', 28, 55, 70, 10, '750100000005'],
            ['SKU-PAN-006', 'Pan baguette', 'Panaderia', 'La Finca', 20, 45, 45, 8, '750100000006'],
            ['SKU-CROI-007', 'Croissant mantequilla', 'Panaderia', 'La Finca', 14, 32, 60, 10, '750100000007'],
            ['SKU-QUEQ-008', 'Queque vainilla', 'Panaderia', 'La Finca', 45, 90, 25, 5, '750100000008'],
            ['SKU-GALL-009', 'Galleta avena', 'Panaderia', 'La Finca', 9, 22, 80, 10, '750100000009'],
            ['SKU-ARRO-010', 'Arroz 1kg', 'Abarrotes', 'Del Sur', 32, 58, 120, 20, '750100000010'],
            ['SKU-FRIJ-011', 'Frijol negro 900g', 'Abarrotes', 'Del Sur', 35, 65, 110, 18, '750100000011'],
            ['SKU-AZUC-012', 'Azucar 1kg', 'Abarrotes', 'Del Sur', 25, 49, 100, 15, '750100000012'],
            ['SKU-SAL-013', 'Sal fina 500g', 'Abarrotes', 'Del Sur', 8, 19, 90, 12, '750100000013'],
            ['SKU-ACEI-014', 'Aceite vegetal 1L', 'Abarrotes', 'Del Sur', 55, 98, 85, 10, '750100000014'],
            ['SKU-PAST-015', 'Pasta spaghetti 500g', 'Abarrotes', 'Del Sur', 22, 42, 95, 15, '750100000015'],
            ['SKU-LECH-016', 'Leche entera 1L', 'Lacteos', 'Tico Fresh', 35, 62, 80, 12, '750100000016'],
            ['SKU-YOGU-017', 'Yogurt fresa 180g', 'Lacteos', 'Tico Fresh', 16, 32, 70, 10, '750100000017'],
            ['SKU-QUES-018', 'Queso fresco 500g', 'Lacteos', 'La Finca', 75, 135, 40, 6, '750100000018'],
            ['SKU-MANT-019', 'Mantequilla 250g', 'Lacteos', 'La Finca', 45, 82, 45, 7, '750100000019'],
            ['SKU-PAPA-020', 'Papas tostadas', 'Snacks', 'Natura', 18, 38, 75, 12, '750100000020'],
            ['SKU-MANI-021', 'Mani salado', 'Snacks', 'Natura', 20, 42, 65, 10, '750100000021'],
            ['SKU-CHOC-022', 'Chocolate barra', 'Snacks', 'Natura', 16, 35, 80, 12, '750100000022'],
            ['SKU-GOMA-023', 'Gomitas frutas', 'Snacks', 'Natura', 12, 28, 60, 10, '750100000023'],
            ['SKU-HEL-024', 'Helado vainilla 1L', 'Congelados', 'Tico Fresh', 60, 120, 35, 5, '750100000024'],
            ['SKU-PIZ-025', 'Pizza congelada', 'Congelados', 'Del Sur', 95, 175, 30, 5, '750100000025'],
            ['SKU-VEG-026', 'Vegetales mixtos', 'Congelados', 'Tico Fresh', 45, 85, 42, 8, '750100000026'],
            ['SKU-DETE-027', 'Detergente 1kg', 'Limpieza', 'Casa Limpia', 48, 92, 55, 8, '750100000027'],
            ['SKU-JABO-028', 'Jabon liquido 500ml', 'Limpieza', 'Casa Limpia', 32, 68, 60, 10, '750100000028'],
            ['SKU-CLOR-029', 'Cloro 1L', 'Limpieza', 'Casa Limpia', 18, 38, 75, 12, '750100000029'],
            ['SKU-DESI-030', 'Desinfectante pino', 'Limpieza', 'Casa Limpia', 24, 52, 65, 10, '750100000030'],
            ['SKU-PAPEL-031', 'Papel higienico 4 rollos', 'Cuidado personal', 'Casa Limpia', 42, 85, 70, 12, '750100000031'],
            ['SKU-SHAM-032', 'Shampoo herbal', 'Cuidado personal', 'Natura', 38, 78, 45, 8, '750100000032'],
            ['SKU-PASTAD-033', 'Pasta dental', 'Cuidado personal', 'Natura', 22, 48, 55, 10, '750100000033'],
            ['SKU-DESO-034', 'Desodorante roll-on', 'Cuidado personal', 'Natura', 35, 72, 40, 8, '750100000034'],
            ['SKU-CERE-035', 'Cereal miel 400g', 'Abarrotes', 'Del Sur', 42, 82, 55, 8, '750100000035'],
            ['SKU-ATUN-036', 'Atun en agua', 'Abarrotes', 'Del Sur', 30, 58, 90, 15, '750100000036'],
            ['SKU-SALSA-037', 'Salsa tomate', 'Abarrotes', 'Del Sur', 18, 36, 75, 10, '750100000037'],
            ['SKU-MAYO-038', 'Mayonesa 400g', 'Abarrotes', 'Del Sur', 35, 70, 60, 8, '750100000038'],
            ['SKU-GAS-039', 'Gaseosa cola 2L', 'Bebidas', 'Tico Fresh', 40, 78, 85, 12, '750100000039'],
            ['SKU-ENER-040', 'Bebida energetica', 'Bebidas', 'Tico Fresh', 32, 68, 55, 8, '750100000040'],
        ];

        foreach ($products as [$sku, $name, $categoryName, $brandName, $cost, $price, $stock, $minStock, $barcode]) {
            Product::updateOrCreate(['sku' => $sku], [
                'category_id' => $categories[$categoryName]->id,
                'brand_id' => $brands[$brandName]->id,
                'supplier_id' => $supplier->id,
                'barcode' => $barcode,
                'name' => $name,
                'cost_price' => $cost,
                'sale_price' => $price,
                'tax_rate' => 13,
                'hacienda_tax_code' => '01',
                'hacienda_tax_rate_code' => '08',
                'cabys_code' => '0000000000000',
                'hacienda_unit_code' => 'Unid',
                'stock' => $stock,
                'min_stock' => $minStock,
                'unit' => 'piece',
                'track_stock' => true,
                'is_active' => true,
            ]);
        }

        $this->call(AccountingCatalogSeeder::class);
    }
}
