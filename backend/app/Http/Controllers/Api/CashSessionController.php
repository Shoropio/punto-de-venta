<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CashSessionRequest;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashSessionController extends Controller
{
    public function registers()
    {
        return CashRegister::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    public function open(CashSessionRequest $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        $existing = CashSession::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        if ($existing) {
            return $existing->load(['cashRegister', 'user']);
        }

        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        $data['opened_at'] = now();
        $data['supervisor_confirmed_at'] = now();
        $data['expected_amount'] = $data['opening_amount'];
        $data['status'] = 'open';

        $session = CashSession::create($data)->load(['cashRegister', 'user']);

        $activityLogger->log($request->user(), 'cash_session.opened', $session, [
            'cash_register_id' => $session->cash_register_id,
            'opening_amount' => $session->opening_amount,
            'shift' => $session->shift,
            'supervisor_name' => $session->supervisor_name,
        ]);

        return response()->json($session, 201);
    }

    public function current(Request $request)
    {
        $session = CashSession::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        if (! $session) {
            return response('null', 200)->header('Content-Type', 'application/json');
        }

        return response()->json($session->load(['cashRegister', 'user']));
    }

    public function summary(CashSession $cashSession)
    {
        $payments = Payment::query()
            ->select('payments.method', DB::raw('SUM(payments.amount) as total'), DB::raw('COUNT(*) as count'))
            ->join('sales', 'sales.id', '=', 'payments.sale_id')
            ->where('sales.cash_session_id', $cashSession->id)
            ->where('sales.status', 'completed')
            ->groupBy('payments.method')
            ->orderBy('payments.method')
            ->get();

        $salesCount = Sale::query()
            ->where('cash_session_id', $cashSession->id)
            ->where('status', 'completed')
            ->count();

        $grossSales = Sale::query()
            ->where('cash_session_id', $cashSession->id)
            ->where('status', 'completed')
            ->sum('total');

        $cashDeposits = CashMovement::query()
            ->where('cash_session_id', $cashSession->id)
            ->where('type', 'deposit')
            ->sum('amount');

        $cashWithdrawals = CashMovement::query()
            ->where('cash_session_id', $cashSession->id)
            ->where('type', 'withdrawal')
            ->sum('amount');

        return response()->json([
            'session' => $cashSession->load(['cashRegister', 'user']),
            'sales_count' => $salesCount,
            'gross_sales' => number_format((float) $grossSales, 2, '.', ''),
            'opening_amount' => $cashSession->opening_amount,
            'expected_amount' => $cashSession->expected_amount,
            'cash_deposits' => number_format((float) $cashDeposits, 2, '.', ''),
            'cash_withdrawals' => number_format((float) $cashWithdrawals, 2, '.', ''),
            'payments' => $payments->map(fn ($payment) => [
                'method' => $payment->method,
                'total' => number_format((float) $payment->total, 2, '.', ''),
                'count' => (int) $payment->count,
            ])->values(),
        ]);
    }

    public function close(Request $request, CashSession $cashSession, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        if ($cashSession->status === 'closed') {
            throw ValidationException::withMessages(['cash_session' => 'La caja ya esta cerrada.']);
        }

        $data = $request->validate([
            'closing_amount' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $cashSession->update([
            'closing_amount' => $data['closing_amount'],
            'difference_amount' => round((float) $data['closing_amount'] - (float) $cashSession->expected_amount, 2),
            'closed_at' => now(),
            'status' => 'closed',
            'notes' => $data['notes'] ?? $cashSession->notes,
        ]);

        $freshSession = $cashSession->fresh()->load(['cashRegister', 'user']);

        $activityLogger->log($request->user(), 'cash_session.closed', $freshSession, [
            'closing_amount' => $freshSession->closing_amount,
            'expected_amount' => $freshSession->expected_amount,
            'difference_amount' => $freshSession->difference_amount,
        ]);

        return $freshSession;
    }
}
