<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        return Invoice::with(['sale', 'customer'])->latest()->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sale_id' => ['required', 'exists:sales,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'tax_id' => ['required', 'string', 'max:30'],
            'legal_name' => ['required', 'string', 'max:180'],
            'email' => ['nullable', 'email', 'max:180'],
            'metadata' => ['nullable', 'array'],
        ]);

        $sale = Sale::findOrFail($data['sale_id']);

        return Invoice::firstOrCreate(
            ['sale_id' => $sale->id],
            [
                ...$data,
                'customer_id' => $data['customer_id'] ?? $sale->customer_id,
                'folio' => 'F-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6)),
                'status' => 'issued',
                'issued_at' => now(),
            ],
        )->load(['sale', 'customer']);
    }
}
