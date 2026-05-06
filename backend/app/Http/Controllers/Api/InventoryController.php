<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockMovementRequest;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function movements(Request $request)
    {
        return StockMovement::with('product')->latest()->paginate($request->integer('per_page', 30));
    }

    public function move(StockMovementRequest $request, StockService $stockService)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data, $request, $stockService) {
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);

            return $stockService->move(
                product: $product,
                type: $data['type'],
                quantity: (float) $data['quantity'],
                user: $request->user(),
                branchId: $data['branch_id'] ?? $request->user()->branch_id,
                notes: $data['notes'] ?? null,
            );
        });
    }
}
