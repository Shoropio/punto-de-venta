<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function salesSummary(Request $request)
    {
        $from = $request->filled('from')
            ? Carbon::parse($request->query('from'))->startOfDay()
            : now()->startOfDay();
        $to = $request->filled('to')
            ? Carbon::parse($request->query('to'))->endOfDay()
            : now()->endOfDay();

        return [
            'range' => ['from' => $from, 'to' => $to],
            'sales_count' => Sale::whereBetween('sold_at', [$from, $to])->count(),
            'gross_sales' => Sale::whereBetween('sold_at', [$from, $to])->sum('total'),
            'payments' => Payment::whereHas('sale', fn ($q) => $q->whereBetween('sold_at', [$from, $to]))
                ->select('method', DB::raw('sum(amount) as total'))
                ->groupBy('method')
                ->get(),
        ];
    }

    public function topProducts(Request $request)
    {
        return SaleItem::select('product_id', 'product_name', DB::raw('sum(quantity) as quantity'), DB::raw('sum(line_total) as total'))
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('quantity')
            ->limit($request->integer('limit', 10))
            ->get();
    }

    public function inventory()
    {
        return Product::select('id', 'sku', 'name', 'stock', 'min_stock', 'sale_price', 'cost_price')
            ->orderBy('name')
            ->get();
    }
}
