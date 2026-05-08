<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'sale_id', 'customer_id', 'folio', 'document_type', 'schema_version',
        'clave', 'numero_consecutivo', 'security_code', 'tax_id', 'legal_name', 'email',
        'status', 'hacienda_status', 'metadata', 'xml_path', 'signed_xml_path',
        'hacienda_response_path', 'hacienda_response', 'issued_at', 'submitted_at',
        'accepted_at', 'rejected_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'hacienda_response' => 'array',
            'issued_at' => 'datetime',
            'submitted_at' => 'datetime',
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function sale(): BelongsTo { return $this->belongsTo(Sale::class); }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
}
