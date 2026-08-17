<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use App\Services\Ai\GeminiService;
use Illuminate\Http\Request;

class FacturitoController extends Controller
{
    public function chat(Request $request, GeminiService $gemini)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'history' => ['nullable', 'array'],
            'history.*.role' => ['required', 'in:user,model'],
            'history.*.text' => ['required', 'string'],
        ]);

        $reply = $gemini->chat($data['message'], $data['history'] ?? []);

        return response()->json(['reply' => $reply]);
    }
}
