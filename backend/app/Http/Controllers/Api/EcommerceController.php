<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\AccessControl;
use App\Services\Ecommerce\EcommerceSyncService;
use Illuminate\Http\Request;

class EcommerceController extends Controller
{
    public function push(Product $product, Request $request, AccessControl $accessControl, EcommerceSyncService $sync)
    {
        $accessControl->authorize($request->user(), 'inventory.manage');

        $data = $request->validate([
            'platforms' => ['sometimes', 'array'],
            'platforms.*' => ['string', 'in:woocommerce,shopify,mercadolibre'],
        ]);

        return $sync->pushProduct($product, $data['platforms'] ?? []);
    }

    public function pull(Request $request, AccessControl $accessControl, EcommerceSyncService $sync)
    {
        $accessControl->authorize($request->user(), 'inventory.manage');

        $data = $request->validate([
            'platform' => ['required', 'string', 'in:woocommerce,shopify'],
        ]);

        $updates = $sync->pullStock($data['platform']);

        return [
            'platform' => $data['platform'],
            'updated_products' => count($updates),
            'product_ids' => $updates,
        ];
    }
}
