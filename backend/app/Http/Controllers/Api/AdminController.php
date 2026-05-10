<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function roles(Request $request, AccessControl $accessControl)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        return Role::with('permissions')->orderBy('display_name')->get();
    }

    public function permissions(Request $request, AccessControl $accessControl)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        return Permission::orderBy('module')->orderBy('name')->get();
    }

    public function users(Request $request, AccessControl $accessControl)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        return User::with(['role.permissions', 'branch'])
            ->select(['id', 'name', 'email', 'role_id', 'branch_id', 'is_active', 'created_at'])
            ->orderBy('name')
            ->get();
    }

    public function storeUser(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user = User::create([
            ...$data,
            'is_active' => $data['is_active'] ?? true,
        ])->load(['role.permissions', 'branch']);

        $activityLogger->log($request->user(), 'user.created', $user, [
            'email' => $user->email,
            'role_id' => $user->role_id,
            'branch_id' => $user->branch_id,
        ]);

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, User $user, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('password', $data) && blank($data['password'])) {
            unset($data['password']);
        }

        $before = $user->only(['name', 'email', 'role_id', 'branch_id', 'is_active']);
        $user->update($data);
        $user = $user->fresh(['role.permissions', 'branch']);

        $activityLogger->log($request->user(), 'user.updated', $user, [
            'before' => $before,
            'after' => $user->only(['name', 'email', 'role_id', 'branch_id', 'is_active']),
            'password_changed' => array_key_exists('password', $data),
        ]);

        return $user;
    }

    public function updateRole(Request $request, Role $role, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $data = $request->validate([
            'display_name' => ['sometimes', 'string', 'max:120'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ]);

        if (array_key_exists('display_name', $data)) {
            $role->update(['display_name' => $data['display_name']]);
        }

        if (array_key_exists('permissions', $data)) {
            $role->permissions()->sync($data['permissions']);
        }

        $role = $role->fresh('permissions');
        $activityLogger->log($request->user(), 'role.updated', $role, [
            'role' => $role->name,
            'permissions' => $role->permissions->pluck('name')->values()->all(),
        ]);

        return $role;
    }

    public function assignUserRole(Request $request, User $user, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $data = $request->validate([
            'role_id' => ['nullable', 'exists:roles,id'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $before = $user->only(['role_id', 'is_active']);
        $user->update($data);
        $user = $user->fresh(['role.permissions', 'branch']);

        $activityLogger->log($request->user(), 'user.role_updated', $user, [
            'before' => $before,
            'after' => $user->only(['role_id', 'is_active']),
        ]);

        return $user;
    }
}
