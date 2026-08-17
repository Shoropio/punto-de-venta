<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashSession;
use App\Models\CreditPayment;
use App\Models\Customer;
use App\Services\Accounting\DoubleEntryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreditPaymentController extends Controller
{
    public function index(Request $request)
    {
        return CreditPayment::with(['customer', 'user'])
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request, DoubleEntryService $accounting)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'cash_session_id' => ['nullable', 'exists:cash_sessions,id'],
            'method' => ['required', 'string', 'max:40'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($data, $request) {
            $customer = Customer::whereKey($data['customer_id'])->lockForUpdate()->firstOrFail();
            $amount = min((float) $data['amount'], (float) $customer->balance);

            if ($amount <= 0) {
                throw ValidationException::withMessages(['amount' => 'El cliente no tiene saldo pendiente.']);
            }

            $session = null;
            if (! empty($data['cash_session_id'])) {
                $session = CashSession::whereKey($data['cash_session_id'])->lockForUpdate()->firstOrFail();
                if ($session->status !== 'open') {
                    throw ValidationException::withMessages(['cash_session_id' => 'La caja debe estar abierta.']);
                }
            }

            $payment = CreditPayment::create([
                ...$data,
                'amount' => $amount,
                'user_id' => $request->user()->id,
            ]);

            $customer->decrement('balance', $amount);

            if ($session && $data['method'] === 'cash') {
                $session->increment('expected_amount', $amount);
            }

            try {
                $accounting->recordCreditPayment($amount, $customer->id, $data['method']);
            } catch (\Throwable) {
                // Accounting failure should not block the payment
            }

            return $payment->load(['customer', 'user']);
        });
    }
}
