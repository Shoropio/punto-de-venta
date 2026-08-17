<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class GoogleAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'credential' => ['required', 'string'],
        ]);

        $credential = $request->string('credential');

        // Verify token against Google API
        $response = Http::get("https://oauth2.googleapis.com/tokeninfo?id_token={$credential}");

        if ($response->failed()) {
            // Fallback for local development/testing offline if token is an email
            if (config('app.env') === 'local' && filter_var($credential, FILTER_VALIDATE_EMAIL)) {
                $email = (string) $credential;
                $name = 'Usuario Demo';
            } else {
                return response()->json(['message' => 'Token de Google invalido o expirado.'], 422);
            }
        } else {
            $data = $response->json();
            $email = $data['email'] ?? null;
            $name = $data['name'] ?? 'Usuario Google';

            if (! $email) {
                return response()->json(['message' => 'El token de Google no contiene un correo valido.'], 422);
            }
        }

        $user = User::with(['role.permissions', 'branch'])->where('email', $email)->first();

        if (! $user) {
            return response()->json(['message' => "El correo {$email} no esta registrado en el sistema. Solicite acceso al administrador."], 403);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Usuario inactivo.'], 403);
        }

        return response()->json([
            'token' => $user->createToken('google-login')->plainTextToken,
            'user' => $user,
        ]);
    }
}
