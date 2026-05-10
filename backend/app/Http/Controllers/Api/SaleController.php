<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use App\Services\SaleService;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        return SaleResource::collection(Sale::with(['items', 'payments'])->latest()->paginate($request->integer('per_page', 20)));
    }

    public function store(SaleRequest $request, SaleService $saleService, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        $sale = $saleService->create($request->validated(), $request->user());
        $activityLogger->log($request->user(), 'sale.completed', $sale, [
            'folio' => $sale->folio,
            'total' => $sale->total,
            'cash_session_id' => $sale->cash_session_id,
        ]);

        return new SaleResource($sale);
    }

    public function show(Sale $sale)
    {
        return new SaleResource($sale->load(['items', 'payments']));
    }

    public function cancel(Request $request, Sale $sale, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        $sale->update(['status' => 'cancelled']);
        $activityLogger->log($request->user(), 'sale.cancelled', $sale, [
            'folio' => $sale->folio,
            'total' => $sale->total,
        ]);

        return new SaleResource($sale->load(['items', 'payments']));
    }
}
