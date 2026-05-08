<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CashSessionRequest;
use App\Models\CashRegister;
use App\Models\CashSession;
use Illuminate\Http\Request;
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

    public function open(CashSessionRequest $request)
    {
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

        return response()->json(CashSession::create($data)->load(['cashRegister', 'user']), 201);
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

        return $cashSession->fresh()->load(['cashRegister', 'user']);
    }
}
