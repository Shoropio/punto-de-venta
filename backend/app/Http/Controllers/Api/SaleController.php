<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        return SaleResource::collection(Sale::with(['items', 'payments'])->latest()->paginate($request->integer('per_page', 20)));
    }

    public function store(SaleRequest $request, SaleService $saleService)
    {
        return new SaleResource($saleService->create($request->validated(), $request->user()));
    }

    public function show(Sale $sale)
    {
        return new SaleResource($sale->load(['items', 'payments']));
    }

    public function cancel(Sale $sale)
    {
        $sale->update(['status' => 'cancelled']);

        return new SaleResource($sale->load(['items', 'payments']));
    }
}
