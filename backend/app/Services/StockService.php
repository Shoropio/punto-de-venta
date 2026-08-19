<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class StockService
{
    public function move(Product $product, string $type, float $quantity, ?User $user = null, ?int $branchId = null, mixed $reference = null, ?string $notes = null): StockMovement
    {
        if (! $product->track_stock) {
            return StockMovement::create([
                'product_id' => $product->id,
                'branch_id' => $branchId,
                'user_id' => $user?->id,
                'reference_type' => is_object($reference) ? $reference::class : null,
                'reference_id' => is_object($reference) ? $reference->id : null,
                'type' => $type,
                'quantity' => $quantity,
                'stock_before' => $product->stock,
                'stock_after' => $product->stock,
                'notes' => $notes,
            ]);
        }

        $locked = Product::whereKey($product->id)->lockForUpdate()->first();
        $before = (float) $locked->stock;
        $after = match ($type) {
            'in', 'refund' => $before + $quantity,
            'out', 'sale' => $before - $quantity,
            'adjustment' => $quantity,
            default => throw ValidationException::withMessages(['type' => 'Tipo de movimiento invalido.']),
        };

        if ($after < 0) {
            throw ValidationException::withMessages(['stock' => "Stock insuficiente para {$product->name}."]);
        }

        $product->forceFill(['stock' => $after])->save();

        return StockMovement::create([
            'product_id' => $product->id,
            'branch_id' => $branchId,
            'user_id' => $user?->id,
            'reference_type' => is_object($reference) ? $reference::class : null,
            'reference_id' => is_object($reference) ? $reference->id : null,
            'type' => $type,
            'quantity' => $quantity,
            'stock_before' => $before,
            'stock_after' => $after,
            'notes' => $notes,
        ]);
    }
}
