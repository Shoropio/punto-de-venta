<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'cabys_code' => $this->cabys_code,
            'name' => $this->name,
            'description' => $this->description,
            'cost_price' => $this->cost_price,
            'sale_price' => $this->sale_price,
            'tax_rate' => $this->tax_rate,
            'hacienda_tax_code' => $this->hacienda_tax_code,
            'hacienda_tax_rate_code' => $this->hacienda_tax_rate_code,
            'stock' => $this->stock,
            'min_stock' => $this->min_stock,
            'unit' => $this->unit,
            'hacienda_unit_code' => $this->hacienda_unit_code,
            'track_stock' => $this->track_stock,
            'is_active' => $this->is_active,
            'category' => $this->whenLoaded('category'),
            'brand' => $this->whenLoaded('brand'),
            'supplier' => $this->whenLoaded('supplier'),
        ];
    }
}
