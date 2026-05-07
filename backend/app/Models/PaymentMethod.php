<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'code', 'name', 'type', 'requires_reference', 'affects_cash_drawer',
        'is_active', 'sort_order', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'requires_reference' => 'boolean',
            'affects_cash_drawer' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'metadata' => 'array',
        ];
    }
}
