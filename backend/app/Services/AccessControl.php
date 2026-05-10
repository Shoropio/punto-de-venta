<?php

namespace App\Services;

use App\Models\User;

class AccessControl
{
    public function authorize(?User $user, string $permission): void
    {
        abort_unless($user, 401);

        $user->loadMissing('role.permissions');

        if (! $user->role) {
            return;
        }

        $allowed = $user->role->permissions->contains(fn ($rolePermission) => $rolePermission->name === $permission);

        abort_unless($allowed, 403, 'No tienes permisos para ejecutar esta accion.');
    }
}
