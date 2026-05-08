<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'identification_type',
        'identification_number',
        'email',
        'phone',
        'address',
        'province',
        'canton',
        'district',
        'barrio',
        'other_signs',
        'credit_limit',
        'balance',
        'loyalty_points',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:2',
            'balance' => 'decimal:2',
            'loyalty_points' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
