<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'sku' => ['nullable', 'string', 'max:80', Rule::unique('products', 'sku')->ignore($productId)],
            'barcode' => ['nullable', 'string', 'max:120', Rule::unique('products', 'barcode')->ignore($productId)],
            'cabys_code' => ['nullable', 'string', 'size:13'],
            'name' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'hacienda_tax_code' => ['nullable', 'string', 'size:2'],
            'hacienda_tax_rate_code' => ['nullable', 'string', 'size:2'],
            'stock' => ['nullable', 'numeric', 'min:0'],
            'min_stock' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:30'],
            'hacienda_unit_code' => ['nullable', 'string', 'max:15'],
            'track_stock' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}
