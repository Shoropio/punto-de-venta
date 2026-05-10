<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index()
    {
        return PaymentMethod::orderBy('sort_order')->orderBy('name')->get();
    }

    public function store(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $data = $request->validate([
            'code' => ['required', 'string', 'max:40'],
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', 'in:cash,card,transfer,credit,other'],
            'requires_reference' => ['boolean'],
            'affects_cash_drawer' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $paymentMethod = PaymentMethod::updateOrCreate(
            ['code' => $data['code']],
            [
                ...$data,
                'requires_reference' => $data['requires_reference'] ?? false,
                'affects_cash_drawer' => $data['affects_cash_drawer'] ?? $data['type'] === 'cash',
                'is_active' => $data['is_active'] ?? true,
            ],
        );

        $activityLogger->log($request->user(), 'payment_method.saved', $paymentMethod, [
            'code' => $paymentMethod->code,
            'name' => $paymentMethod->name,
            'type' => $paymentMethod->type,
            'is_active' => $paymentMethod->is_active,
        ]);

        return $paymentMethod;
    }

    public function update(Request $request, PaymentMethod $paymentMethod, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'type' => ['sometimes', 'in:cash,card,transfer,credit,other'],
            'requires_reference' => ['sometimes', 'boolean'],
            'affects_cash_drawer' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $before = $paymentMethod->only(['name', 'type', 'requires_reference', 'affects_cash_drawer', 'is_active', 'sort_order']);
        $paymentMethod->update($data);
        $activityLogger->log($request->user(), 'payment_method.updated', $paymentMethod, [
            'before' => $before,
            'after' => $paymentMethod->only(['name', 'type', 'requires_reference', 'affects_cash_drawer', 'is_active', 'sort_order']),
        ]);

        return $paymentMethod->fresh();
    }
}
