<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index()
    {
        return PaymentMethod::orderBy('sort_order')->orderBy('name')->get();
    }

    public function store(Request $request)
    {
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

        return PaymentMethod::updateOrCreate(
            ['code' => $data['code']],
            [
                ...$data,
                'requires_reference' => $data['requires_reference'] ?? false,
                'affects_cash_drawer' => $data['affects_cash_drawer'] ?? $data['type'] === 'cash',
                'is_active' => $data['is_active'] ?? true,
            ],
        );
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'type' => ['sometimes', 'in:cash,card,transfer,credit,other'],
            'requires_reference' => ['sometimes', 'boolean'],
            'affects_cash_drawer' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $paymentMethod->update($data);

        return $paymentMethod->fresh();
    }
}
