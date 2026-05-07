<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'sale_id', 'customer_id', 'folio', 'tax_id', 'legal_name', 'email',
        'status', 'metadata', 'issued_at',
    ];

    protected function casts(): array
    {
        return ['metadata' => 'array', 'issued_at' => 'datetime'];
    }

    public function sale(): BelongsTo { return $this->belongsTo(Sale::class); }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
}
