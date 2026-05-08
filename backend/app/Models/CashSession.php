<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashSession extends Model
{
    protected $fillable = [
        'cash_register_id', 'user_id', 'shift', 'supervisor_name', 'supervisor_confirmed_at',
        'opening_amount', 'closing_amount', 'expected_amount', 'difference_amount',
        'opened_at', 'closed_at', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'opening_amount' => 'decimal:2',
            'closing_amount' => 'decimal:2',
            'expected_amount' => 'decimal:2',
            'difference_amount' => 'decimal:2',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'supervisor_confirmed_at' => 'datetime',
        ];
    }

    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
