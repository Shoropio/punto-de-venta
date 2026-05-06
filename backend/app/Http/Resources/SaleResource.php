<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'folio' => $this->folio,
            'subtotal' => $this->subtotal,
            'discount_total' => $this->discount_total,
            'tax_total' => $this->tax_total,
            'total' => $this->total,
            'paid_total' => $this->paid_total,
            'change_total' => $this->change_total,
            'status' => $this->status,
            'sold_at' => $this->sold_at,
            'items' => $this->whenLoaded('items'),
            'payments' => $this->whenLoaded('payments'),
        ];
    }
}
