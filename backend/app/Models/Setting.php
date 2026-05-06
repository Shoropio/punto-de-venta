<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['branch_id', 'key', 'value', 'group'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }
}
