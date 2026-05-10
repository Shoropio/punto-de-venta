<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashMovement;
use App\Models\CashSession;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashMovementController extends Controller
{
    public function index(Request $request)
    {
        return CashMovement::with(['user'])
            ->when($request->integer('cash_session_id'), fn ($query, $sessionId) => $query->where('cash_session_id', $sessionId))
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        $data = $request->validate([
            'cash_session_id' => ['required', 'exists:cash_sessions,id'],
            'type' => ['required', 'in:deposit,withdrawal'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reason' => ['required', 'string', 'max:160'],
            'reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($data, $request, $activityLogger) {
            $session = CashSession::whereKey($data['cash_session_id'])->lockForUpdate()->firstOrFail();

            if ($session->status !== 'open') {
                throw ValidationException::withMessages(['cash_session_id' => 'La caja debe estar abierta.']);
            }

            $movement = CashMovement::create([
                ...$data,
                'user_id' => $request->user()->id,
            ]);

            $delta = (float) $data['amount'] * ($data['type'] === 'deposit' ? 1 : -1);
            $session->increment('expected_amount', $delta);

            $activityLogger->log($request->user(), 'cash_movement.created', $movement, [
                'cash_session_id' => $movement->cash_session_id,
                'type' => $movement->type,
                'amount' => $movement->amount,
                'reason' => $movement->reason,
                'reference' => $movement->reference,
            ]);

            return $movement->load('user');
        });
    }
}
