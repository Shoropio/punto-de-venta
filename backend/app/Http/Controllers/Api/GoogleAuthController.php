<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GoogleAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'credential' => ['required', 'string'],
        ]);

        $credential = (string) $request->string('credential');

        $response = Http::get("https://oauth2.googleapis.com/tokeninfo?id_token={$credential}");

        if ($response->failed()) {
            return response()->json(['message' => 'Token de Google invalido o expirado.'], 422);
        }

        $data = $response->json();
        $email = $data['email'] ?? null;
        $name = $data['name'] ?? 'Usuario Google';
        $audience = $data['aud'] ?? null;
        $expectedClientId = config('services.google.client_id', '');

        if ($expectedClientId && $audience !== $expectedClientId) {
            return response()->json(['message' => 'Token emitido para un cliente no autorizado.'], 422);
        }

        $emailVerified = $data['email_verified'] ?? false;
        if (! $emailVerified) {
            return response()->json(['message' => 'El correo de Google no esta verificado.'], 422);
        }

        if (! $email) {
            return response()->json(['message' => 'El token de Google no contiene un correo valido.'], 422);
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
