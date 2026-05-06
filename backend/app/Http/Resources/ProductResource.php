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
            'name' => $this->name,
            'description' => $this->description,
            'cost_price' => $this->cost_price,
            'sale_price' => $this->sale_price,
            'tax_rate' => $this->tax_rate,
            'stock' => $this->stock,
            'min_stock' => $this->min_stock,
            'unit' => $this->unit,
            'track_stock' => $this->track_stock,
            'is_active' => $this->is_active,
            'category' => $this->whenLoaded('category'),
            'brand' => $this->whenLoaded('brand'),
            'supplier' => $this->whenLoaded('supplier'),
        ];
    }
}
