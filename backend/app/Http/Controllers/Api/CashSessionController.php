<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CashSessionRequest;
use App\Models\CashSession;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CashSessionController extends Controller
{
    public function open(CashSessionRequest $request)
    {
        $existing = CashSession::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        if ($existing) {
            return $existing;
        }

        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        $data['opened_at'] = now();
        $data['expected_amount'] = $data['opening_amount'];

        return CashSession::create($data);
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

        return response()->json($session);
    }

    public function close(Request $request, CashSession $cashSession)
    {
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

        return $cashSession->fresh();
    }
}
