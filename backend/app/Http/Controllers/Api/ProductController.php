<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand', 'supplier'])->latest();

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

    public function store(ProductRequest $request)
    {
        return new ProductResource(Product::create($request->validated())->load(['category', 'brand', 'supplier']));
    }

    public function show(Product $product)
    {
        return new ProductResource($product->load(['category', 'brand', 'supplier']));
    }

    public function update(ProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        return new ProductResource($product->load(['category', 'brand', 'supplier']));
    }

    public function destroy(Product $product)
    {
        $product->update(['is_active' => false]);

        return response()->noContent();
    }
}
