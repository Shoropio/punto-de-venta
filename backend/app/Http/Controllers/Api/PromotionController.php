<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index(Request $request)
    {
        return Promotion::query()
            ->when($request->boolean('active'), fn ($query) => $query->currentlyActive())
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'code' => ['required', 'string', 'max:40'],
            'discount_type' => ['required', 'in:percent,fixed'],
            'discount_value' => ['required', 'numeric', 'gt:0'],
            'min_sale_amount' => ['nullable', 'numeric', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        return Promotion::updateOrCreate(
            ['code' => $data['code']],
            [...$data, 'min_sale_amount' => $data['min_sale_amount'] ?? 0, 'is_active' => $data['is_active'] ?? true],
        );
    }
}
