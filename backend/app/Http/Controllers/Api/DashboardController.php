<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashSession;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Sale;
use App\Services\AccessControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request, AccessControl $accessControl)
    {
        $accessControl->authorize($request->user(), 'reports.view');

        $today = now()->toDateString();

        $payments = DB::table('payments')
            ->join('sales', 'sales.id', '=', 'payments.sale_id')
            ->whereDate('sales.sold_at', $today)
            ->where('sales.status', 'completed')
            ->select('payments.method', DB::raw('SUM(payments.amount) as total'))
            ->groupBy('payments.method')
            ->orderBy('payments.method')
            ->get();

        return [
            'sales_today' => Sale::whereDate('sold_at', $today)->where('status', 'completed')->count(),
            'gross_today' => number_format((float) Sale::whereDate('sold_at', $today)->where('status', 'completed')->sum('total'), 2, '.', ''),
            'open_cash_sessions' => CashSession::where('status', 'open')->with(['cashRegister', 'user'])->latest()->get(),
            'payments_today' => $payments,
            'low_stock' => Product::whereColumn('stock', '<=', 'min_stock')->where('is_active', true)->count(),
            'pending_hacienda' => Invoice::whereIn('hacienda_status', ['pending_xml', 'generated', 'xml_generated', 'signed', 'submitted', 'received', 'processing'])->count(),
            'rejected_hacienda' => Invoice::whereIn('hacienda_status', ['rejected', 'error', 'submit_failed'])->count(),
        ];
    }
}
