<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccountingCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // ACTIVOS
            ['code' => '1.1.01', 'name' => 'Caja', 'type' => 'asset'],
            ['code' => '1.1.02', 'name' => 'Banco BAC', 'type' => 'asset'],
            ['code' => '1.1.03', 'name' => 'Banco BNCR', 'type' => 'asset'],
            ['code' => '1.1.04', 'name' => 'Banco Popular', 'type' => 'asset'],
            ['code' => '1.1.05', 'name' => 'Cuenta Corriente Banco Nacional', 'type' => 'asset'],
            ['code' => '1.1.06', 'name' => 'Cuentas por Cobrar Clientes', 'type' => 'asset'],
            ['code' => '1.1.07', 'name' => 'Inventario de Mercaderia', 'type' => 'asset'],
            ['code' => '1.2.01', 'name' => 'Equipo de Oficina', 'type' => 'asset'],
            ['code' => '1.2.02', 'name' => 'Equipo de Computo', 'type' => 'asset'],
            ['code' => '1.2.03', 'name' => 'Maquinaria y Equipo', 'type' => 'asset'],
            ['code' => '1.2.04', 'name' => 'Vehiculos', 'type' => 'asset'],
            ['code' => '1.2.05', 'name' => 'Mobiliario y Enseres', 'type' => 'asset'],
            ['code' => '1.3.01', 'name' => 'IVA Acreditable', 'type' => 'asset'],

            // PASIVOS
            ['code' => '2.1.01', 'name' => 'Cuentas por Pagar Proveedores', 'type' => 'liability'],
            ['code' => '2.1.02', 'name' => 'IVA Proporcional', 'type' => 'liability'],
            ['code' => '2.1.03', 'name' => 'IVA por Pagar', 'type' => 'liability'],
            ['code' => '2.1.04', 'name' => 'Retenciones por Pagar', 'type' => 'liability'],
            ['code' => '2.1.05', 'name' => 'Aguinaldo por Pagar', 'type' => 'liability'],
            ['code' => '2.1.06', 'name' => 'Vacaciones por Pagar', 'type' => 'liability'],
            ['code' => '2.1.07', 'name' => 'Prestamos Bancarios', 'type' => 'liability'],
            ['code' => '2.2.01', 'name' => 'Credito a Largo Plazo', 'type' => 'liability'],

            // CAPITAL
            ['code' => '3.1.01', 'name' => 'Capital Social', 'type' => 'equity'],
            ['code' => '3.1.02', 'name' => 'Utilidades Retenidas', 'type' => 'equity'],
            ['code' => '3.1.03', 'name' => 'Utilidad del Ejercicio', 'type' => 'equity'],

            // INGRESOS
            ['code' => '4.1.01', 'name' => 'Ventas de Mercaderia', 'type' => 'income'],
            ['code' => '4.1.02', 'name' => 'Ventas Exentas', 'type' => 'income'],
            ['code' => '4.1.03', 'name' => 'Devoluciones en Ventas', 'type' => 'income'],
            ['code' => '4.1.04', 'name' => 'Descuentos en Ventas', 'type' => 'income'],
            ['code' => '4.2.01', 'name' => 'Otros Ingresos', 'type' => 'income'],
            ['code' => '4.2.02', 'name' => 'Intereses Ganados', 'type' => 'income'],

            // EGRESOS / GASTOS
            ['code' => '5.1.01', 'name' => 'Costo de Mercaderia Vendida', 'type' => 'expense'],
            ['code' => '5.2.01', 'name' => 'Sueldos y Salarios', 'type' => 'expense'],
            ['code' => '5.2.02', 'name' => 'Caja de Seguro Social', 'type' => 'expense'],
            ['code' => '5.2.03', 'name' => 'Instituto Mixto de Ayuda Social', 'type' => 'expense'],
            ['code' => '5.2.04', 'name' => 'Aguinaldo', 'type' => 'expense'],
            ['code' => '5.2.05', 'name' => 'Vacaciones', 'type' => 'expense'],
            ['code' => '5.2.06', 'name' => 'Obligaciones Laborales', 'type' => 'expense'],
            ['code' => '5.3.01', 'name' => 'Arrendamiento', 'type' => 'expense'],
            ['code' => '5.3.02', 'name' => 'Servicios Publicos', 'type' => 'expense'],
            ['code' => '5.3.03', 'name' => 'Telecomunicaciones', 'type' => 'expense'],
            ['code' => '5.3.04', 'name' => 'Mantenimiento y Reparaciones', 'type' => 'expense'],
            ['code' => '5.3.05', 'name' => 'Suministros de Oficina', 'type' => 'expense'],
            ['code' => '5.3.06', 'name' => 'Papeleria y Utiles', 'type' => 'expense'],
            ['code' => '5.4.01', 'name' => 'Publicidad y Mercadeo', 'type' => 'expense'],
            ['code' => '5.4.02', 'name' => 'Gastos de Representacion', 'type' => 'expense'],
            ['code' => '5.5.01', 'name' => 'Seguros', 'type' => 'expense'],
            ['code' => '5.5.02', 'name' => 'Impuestos y Contribuciones', 'type' => 'expense'],
            ['code' => '5.5.03', 'name' => 'Multas y Sanciones', 'type' => 'expense'],
            ['code' => '5.6.01', 'name' => 'Depreciacion Equipos', 'type' => 'expense'],
            ['code' => '5.6.02', 'name' => 'Amortizacion Activos Intangibles', 'type' => 'expense'],
            ['code' => '5.7.01', 'name' => 'Gastos Bancarios', 'type' => 'expense'],
            ['code' => '5.7.02', 'name' => 'Comisiones Ventas', 'type' => 'expense'],
            ['code' => '5.7.03', 'name' => 'Intereses Pagados', 'type' => 'expense'],
        ];

        foreach ($accounts as $account) {
            DB::table('accounting_accounts')->updateOrInsert(
                ['code' => $account['code']],
                [
                    'name' => $account['name'],
                    'type' => $account['type'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
