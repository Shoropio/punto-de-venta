<?php

namespace App\Services;

use App\Models\CashSession;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function __construct(private readonly StockService $stockService)
    {
    }

    public function create(array $data, User $user): Sale
    {
        return DB::transaction(function () use ($data, $user) {
            $session = CashSession::whereKey($data['cash_session_id'])->lockForUpdate()->firstOrFail();

            if ($session->status !== 'open') {
                throw ValidationException::withMessages(['cash_session_id' => 'La caja debe estar abierta.']);
            }

            $itemsPayload = collect($data['items']);
            $discountTotal = (float) ($data['discount_total'] ?? 0);
            $subtotal = 0;
            $taxTotal = 0;

            $sale = Sale::create([
                'branch_id' => $user->branch_id ?? 1,
                'cash_session_id' => $session->id,
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => $user->id,
                'folio' => 'S-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6)),
                'subtotal' => 0,
                'discount_total' => $discountTotal,
                'tax_total' => 0,
                'total' => 0,
                'paid_total' => 0,
                'change_total' => 0,
                'sold_at' => now(),
            ]);

            foreach ($itemsPayload as $payload) {
                $product = Product::whereKey($payload['product_id'])->lockForUpdate()->firstOrFail();
                $quantity = (float) $payload['quantity'];
                $unitPrice = (float) ($payload['unit_price'] ?? $product->sale_price);
                $lineDiscount = (float) ($payload['discount_amount'] ?? 0);
                $lineBase = max(0, ($quantity * $unitPrice) - $lineDiscount);
                $lineTax = round($lineBase * ((float) $product->tax_rate / 100), 2);
                $lineTotal = round($lineBase + $lineTax, 2);

                $sale->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => $lineDiscount,
                    'tax_rate' => $product->tax_rate,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineTotal,
                ]);

                $subtotal += $quantity * $unitPrice;
                $taxTotal += $lineTax;
                $this->stockService->move($product, 'sale', $quantity, $user, $user->branch_id, $sale, 'Venta ' . $sale->folio);
            }

            if (! empty($data['promotion_code'])) {
                $promotion = Promotion::currentlyActive()->where('code', $data['promotion_code'])->first();

                if ($promotion && (float) $promotion->min_sale_amount <= $subtotal) {
                    $discountTotal += $promotion->discount_type === 'percent'
                        ? round($subtotal * ((float) $promotion->discount_value / 100), 2)
                        : (float) $promotion->discount_value;
                }
            }

            $discountTotal = min($discountTotal, $subtotal);
            $total = round(max(0, $subtotal - $discountTotal) + $taxTotal, 2);
            $paidTotal = collect($data['payments'])->sum(fn (array $payment): float => (float) $payment['amount']);
            $creditTotal = collect($data['payments'])
                ->where('method', 'credit')
                ->sum(fn (array $payment): float => (float) $payment['amount']);
            $cashTotal = collect($data['payments'])
                ->where('method', 'cash')
                ->sum(fn (array $payment): float => (float) $payment['amount']);
            $changeTotal = round(max(0, $paidTotal - $total), 2);
            $cashDrawerIncrease = round(max(0, $cashTotal - $changeTotal), 2);

            if ($creditTotal > 0 && empty($data['customer_id'])) {
                throw ValidationException::withMessages(['customer_id' => 'Selecciona un cliente para venta a credito.']);
            }

            if ($paidTotal < $total) {
                throw ValidationException::withMessages(['payments' => 'El pago no cubre el total de la venta.']);
            }

            foreach ($data['payments'] as $payment) {
                $sale->payments()->create($payment);
            }

            $sale->update([
                'subtotal' => round($subtotal, 2),
                'discount_total' => round($discountTotal, 2),
                'tax_total' => round($taxTotal, 2),
                'total' => $total,
                'paid_total' => round($paidTotal, 2),
                'change_total' => $changeTotal,
            ]);

            if ($creditTotal > 0) {
                Customer::whereKey($data['customer_id'])->increment('balance', $creditTotal);
            }

            $session->increment('expected_amount', $cashDrawerIncrease);

            return $sale->load(['items', 'payments']);
        });
    }
}
