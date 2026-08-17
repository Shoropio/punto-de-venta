<?php

namespace App\Observers;

use App\Models\Sale;
use App\Services\Accounting\DoubleEntryService;
use Illuminate\Support\Facades\Log;

class SaleObserver
{
    public function __construct(
        private readonly DoubleEntryService $doubleEntryService,
    ) {}

    public function created(Sale $sale): void
    {
        try {
            $this->doubleEntryService->recordSale($sale);
            Log::info('Double entry recorded for sale', ['sale_id' => $sale->id, 'folio' => $sale->folio]);
        } catch (\Throwable $e) {
            Log::error('Failed to record double entry for sale', [
                'sale_id' => $sale->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
