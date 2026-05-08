<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CashSessionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'cash_register_id' => ['required', 'exists:cash_registers,id'],
            'opening_amount' => ['required', 'numeric', 'min:0'],
            'shift' => ['required', 'string', 'max:40'],
            'supervisor_name' => ['required', 'string', 'max:160'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
