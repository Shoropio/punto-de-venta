<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashSession;
use App\Models\Product;
use App\Models\Refund;
use App\Models\Sale;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RefundController extends Controller
{
    public function index(Request $request)
    {
        return Refund::with(['sale', 'user'])->latest()->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request, StockService $stockService, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        $data = $request->validate([
            'sale_id' => ['required', 'exists:sales,id'],
            'reason' => ['required', 'string', 'max:220'],
        ]);

        return DB::transaction(function () use ($data, $request, $stockService, $activityLogger) {
            $sale = Sale::with('items.product')->lockForUpdate()->findOrFail($data['sale_id']);

            if (! in_array($sale->status, ['completed', 'partial_refund'], true)) {
                throw ValidationException::withMessages(['sale_id' => 'La venta no puede devolverse en su estado actual.']);
            }

            $refund = Refund::create([
                'sale_id' => $sale->id,
                'user_id' => $request->user()->id,
                'amount' => $sale->total,
                'reason' => $data['reason'],
                'status' => 'approved',
                'items' => $sale->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'quantity' => $item->quantity,
                    'line_total' => $item->line_total,
                ])->values()->all(),
            ]);

            foreach ($sale->items as $item) {
                $product = Product::whereKey($item->product_id)->lockForUpdate()->first();
                if ($product) {
                    $stockService->move($product, 'refund', (float) $item->quantity, $request->user(), $sale->branch_id, $refund, 'Devolucion ' . $sale->folio);
                }
            }

            $sale->update(['status' => 'refunded']);

            CashSession::whereKey($sale->cash_session_id)
                ->where('status', 'open')
                ->decrement('expected_amount', (float) $sale->total);

            $activityLogger->log($request->user(), 'refund.created', $refund, [
                'sale_id' => $sale->id,
                'sale_folio' => $sale->folio,
                'amount' => $refund->amount,
                'reason' => $refund->reason,
            ]);

            return $refund->load(['sale', 'user']);
        });
    }
}
