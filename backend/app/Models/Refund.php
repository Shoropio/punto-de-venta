<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refund extends Model
{
    protected $fillable = ['sale_id', 'user_id', 'amount', 'reason', 'status', 'items'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'items' => 'array'];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
