<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'brand_id', 'supplier_id', 'sku', 'barcode', 'name', 'description',
        'cabys_code', 'cost_price', 'sale_price', 'tax_rate', 'hacienda_tax_code',
        'hacienda_tax_rate_code', 'stock', 'min_stock', 'unit', 'hacienda_unit_code',
        'track_stock', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'stock' => 'decimal:3',
            'min_stock' => 'decimal:3',
            'track_stock' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function brand(): BelongsTo { return $this->belongsTo(Brand::class); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function stockMovements(): HasMany { return $this->hasMany(StockMovement::class); }
}
