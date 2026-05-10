<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand', 'supplier'])->latest();

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        if ($search = $request->query('search')) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhere('barcode', 'like', "%{$search}%"));
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('stock', '<=', 'min_stock');
        }

        return ProductResource::collection($query->paginate($request->integer('per_page', 20)));
    }

    public function store(ProductRequest $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'products.delete');

        $data = $request->validated();
        $data['sku'] = ($data['sku'] ?? null) ?: $this->generateSku();
        $data['barcode'] = ($data['barcode'] ?? null) ?: $this->generateBarcode();

        $product = Product::create($data)->fresh(['category', 'brand', 'supplier']);
        $activityLogger->log($request->user(), 'product.created', $product, [
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'name' => $product->name,
        ]);

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function show(Product $product)
    {
        return new ProductResource($product->load(['category', 'brand', 'supplier']));
    }

    public function update(ProductRequest $request, Product $product, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'inventory.manage');

        $data = $request->validated();
        $data['sku'] = ($data['sku'] ?? null) ?: $this->generateSku();
        $data['barcode'] = array_key_exists('barcode', $data) && ! $data['barcode'] ? $this->generateBarcode() : ($data['barcode'] ?? $product->barcode);

        $before = $product->only(['sku', 'barcode', 'name', 'sale_price', 'stock', 'is_active']);
        $product->update($data);
        $activityLogger->log($request->user(), 'product.updated', $product, [
            'before' => $before,
            'after' => $product->only(['sku', 'barcode', 'name', 'sale_price', 'stock', 'is_active']),
        ]);

        return new ProductResource($product->load(['category', 'brand', 'supplier']));
    }

    public function destroy(Request $request, Product $product, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'inventory.manage');

        $product->update(['is_active' => false]);
        $activityLogger->log($request->user(), 'product.deactivated', $product, [
            'sku' => $product->sku,
            'name' => $product->name,
        ]);

        return response()->noContent();
    }

    public function identifiers()
    {
        return [
            'sku' => $this->generateSku(),
            'barcode' => $this->generateBarcode(),
        ];
    }

    private function generateSku(): string
    {
        do {
            $sku = 'SKU-' . now()->format('ymd') . '-' . Str::upper(Str::random(5));
        } while (Product::where('sku', $sku)->exists());

        return $sku;
    }

    private function generateBarcode(): string
    {
        do {
            $barcode = '750' . str_pad((string) random_int(0, 9999999999), 10, '0', STR_PAD_LEFT);
        } while (Product::where('barcode', $barcode)->exists());

        return $barcode;
    }
}
