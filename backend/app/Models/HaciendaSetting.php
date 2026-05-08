<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HaciendaSetting extends Model
{
    protected $fillable = [
        'branch_id',
        'environment',
        'schema_version',
        'legal_name',
        'commercial_name',
        'identification_type',
        'identification_number',
        'economic_activity_code',
        'province',
        'canton',
        'district',
        'barrio',
        'other_signs',
        'country_code',
        'phone',
        'email',
        'branch_code',
        'terminal_code',
        'invoice_sequence',
        'ticket_sequence',
        'credit_note_sequence',
        'debit_note_sequence',
        'certificate_path',
        'certificate_pin',
        'api_username',
        'api_password',
        'callback_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'certificate_pin' => 'encrypted',
            'api_password' => 'encrypted',
            'is_active' => 'boolean',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
