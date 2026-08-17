<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use App\Services\Inventory\ProductImportService;
use Illuminate\Http\Request;

class ProductImportController extends Controller
{
    public function import(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger, ProductImportService $importService)
    {
        $accessControl->authorize($request->user(), 'inventory.manage');

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $content = file_get_contents($request->file('file')->getRealPath());
        $result  = $importService->parseCsv($content);
        $summary = $importService->upsert($result['products']);

        $activityLogger->log($request->user(), 'inventory.csv_import', null, $summary);

        return response()->json([
            ...$summary,
            'warnings' => $result['warnings'],
        ]);
    }

    /**
     * Return a downloadable CSV template with the expected headers.
     */
    public function template()
    {
        $headers = ['sku', 'nombre', 'descripcion', 'precio_venta', 'precio_costo', 'stock', 'impuesto', 'categoria', 'marca', 'codigo_barras', 'cabys', 'activo'];
        $example = ['PROD-001', 'Café Americano', 'Café americano caliente', '2500', '1200', '100', '13', 'Bebidas', 'Mi Marca', '750100000001', '1150100010000', 'si'];

        $csv  = implode(',', $headers) . "\n";
        $csv .= implode(',', $example) . "\n";

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="plantilla_productos.csv"',
        ]);
    }
}
