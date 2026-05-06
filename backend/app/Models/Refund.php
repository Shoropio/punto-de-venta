<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Refund extends Model
{
    protected $fillable = ['sale_id', 'user_id', 'amount', 'reason', 'status', 'items'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'items' => 'array'];
    }
}
