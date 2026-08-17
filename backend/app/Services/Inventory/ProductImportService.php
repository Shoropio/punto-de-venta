<?php

namespace App\Services\Inventory;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductImportService
{
    /**
     * Parse CSV and return array of products ready to upsert.
     * Expected columns: sku, name, description, sale_price, cost_price, stock, tax_rate,
     *                   category, brand, barcode, cabys_code, is_active
     */
    public function parseCsv(string $csvContent): array
    {
        $lines = array_filter(array_map('trim', explode("\n", trim($csvContent))));
        if (count($lines) < 2) {
            throw ValidationException::withMessages(['file' => 'El archivo CSV debe contener al menos una fila de encabezado y una fila de datos.']);
        }

        $headers = array_map(
            fn($h) => strtolower(trim(str_replace(['"', "'", ' ', '-'], ['', '', '_', '_'], $h))),
            str_getcsv(array_shift($lines))
        );

        $products = [];
        $errors   = [];
        $rowNum   = 2;

        foreach ($lines as $line) {
            $cells = str_getcsv(trim($line));
            $row   = array_combine(array_slice($headers, 0, count($cells)), array_slice($cells, 0, count($headers)));

            $name = trim($row['nombre'] ?? $row['name'] ?? '');
            if (! $name) {
                $errors[] = "Fila {$rowNum}: columna 'nombre' o 'name' es obligatoria.";
                $rowNum++;
                continue;
            }

            $salePriceRaw = $row['precio_venta'] ?? $row['sale_price'] ?? $row['precio'] ?? $row['price'] ?? '0';
            $salePrice    = (float) str_replace([',', ' '], ['', ''], $salePriceRaw);

            $categoryName = trim($row['categoria'] ?? $row['category'] ?? 'General');
            $brandName    = trim($row['marca'] ?? $row['brand'] ?? '');

            $products[] = [
                'sku'         => trim($row['sku'] ?? $row['codigo'] ?? ''),
                'name'        => $name,
                'description' => trim($row['descripcion'] ?? $row['description'] ?? ''),
                'sale_price'  => $salePrice,
                'cost_price'  => (float) str_replace([',', ' '], ['', ''], $row['precio_costo'] ?? $row['cost_price'] ?? '0'),
                'stock'       => (int) ($row['stock'] ?? $row['existencia'] ?? 0),
                'tax_rate'    => (float) ($row['impuesto'] ?? $row['tax_rate'] ?? '13'),
                'barcode'     => trim($row['codigo_barras'] ?? $row['barcode'] ?? ''),
                'cabys_code'  => trim($row['cabys'] ?? $row['cabys_code'] ?? ''),
                'is_active'   => in_array(strtolower($row['activo'] ?? $row['is_active'] ?? 'si'), ['1', 'si', 'yes', 'true', 'activo']),
                '_category'   => $categoryName,
                '_brand'      => $brandName,
            ];

            $rowNum++;
        }

        if (! empty($errors) && empty($products)) {
            throw ValidationException::withMessages(['file' => implode('; ', $errors)]);
        }

        return ['products' => $products, 'warnings' => $errors];
    }

    /**
     * Upsert parsed products into the database.
     */
    public function upsert(array $products, ?int $branchId = null): array
    {
        $created  = 0;
        $updated  = 0;
        $skipped  = 0;

        foreach ($products as $data) {
            $categoryName = $data['_category'];
            $brandName    = $data['_brand'];
            unset($data['_category'], $data['_brand']);

            // Resolve category
            $categorySlug = \Illuminate\Support\Str::slug($categoryName);
            $category = DB::table('categories')->where('slug', $categorySlug)->first()
                ?? DB::table('categories')->where('name', $categoryName)->first();
            if (! $category) {
                $catId = DB::table('categories')->insertGetId([
                    'name' => $categoryName, 'slug' => $categorySlug,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            } else {
                $catId = $category->id;
            }

            // Resolve brand
            $brandId = null;
            if ($brandName) {
                $brand = DB::table('brands')->where('name', $brandName)->first();
                $brandId = $brand?->id ?? DB::table('brands')->insertGetId([
                    'name' => $brandName, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            $payload = array_merge($data, [
                'category_id' => $catId,
                'brand_id'    => $brandId,
                'updated_at'  => now(),
            ]);

            // Try to find existing by SKU or name
            $existing = ($data['sku'] ? DB::table('products')->where('sku', $data['sku'])->first() : null)
                ?? DB::table('products')->where('name', $data['name'])->first();

            if ($existing) {
                DB::table('products')->where('id', $existing->id)->update($payload);
                $updated++;
            } else {
                if (! $data['sku']) {
                    $payload['sku'] = 'IMP-' . strtoupper(\Illuminate\Support\Str::random(6));
                }
                $payload['created_at'] = now();
                DB::table('products')->insert($payload);
                $created++;
            }
        }

        return ['created' => $created, 'updated' => $updated, 'skipped' => $skipped];
    }
}
