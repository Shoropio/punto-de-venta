<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class BarcodeController extends Controller
{
    public function generate()
    {
        do {
            $barcode = '20' . now()->format('ymd') . random_int(10000, 99999);
        } while (Product::where('barcode', $barcode)->exists());

        return ['barcode' => $barcode];
    }

    public function assign(Request $request, Product $product)
    {
        $data = $request->validate([
            'barcode' => ['required', 'string', 'max:80', 'unique:products,barcode,' . $product->id],
        ]);

        $product->update(['barcode' => $data['barcode']]);

        return $product->fresh(['category', 'brand', 'supplier']);
    }
}
