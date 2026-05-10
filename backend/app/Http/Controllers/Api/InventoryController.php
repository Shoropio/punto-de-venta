<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockMovementRequest;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function movements(Request $request)
    {
        return StockMovement::with('product')
            ->when($request->integer('product_id'), fn ($query, $productId) => $query->where('product_id', $productId))
            ->latest()
            ->paginate($request->integer('per_page', 30));
    }

    public function move(StockMovementRequest $request, StockService $stockService, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'inventory.manage');

        $data = $request->validated();

        return DB::transaction(function () use ($data, $request, $stockService, $activityLogger) {
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);

            $movement = $stockService->move(
                product: $product,
                type: $data['type'],
                quantity: (float) $data['quantity'],
                user: $request->user(),
                branchId: $data['branch_id'] ?? $request->user()->branch_id,
                notes: $data['notes'] ?? null,
            );

            $activityLogger->log($request->user(), 'stock_movement.created', $movement, [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'type' => $movement->type,
                'quantity' => $movement->quantity,
            ]);

            return $movement;
        });
    }
}
