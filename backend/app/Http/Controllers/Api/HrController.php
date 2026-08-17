<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HrController extends Controller
{
    // ─── Employees ──────────────────────────────────────────────────────────

    public function employees(Request $request)
    {
        return DB::table('employees')->orderBy('name')->get();
    }

    public function storeEmployee(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hr.manage');

        $data = $request->validate([
            'name'           => ['required', 'string', 'max:160'],
            'identification' => ['nullable', 'string', 'max:20'],
            'position'       => ['nullable', 'string', 'max:100'],
            'department'     => ['nullable', 'string', 'max:100'],
            'phone'          => ['nullable', 'string', 'max:30'],
            'email'          => ['nullable', 'email', 'max:180'],
            'hire_date'      => ['nullable', 'date'],
            'pin'            => ['nullable', 'string', 'max:10'],
            'user_id'        => ['nullable', 'exists:users,id'],
        ]);

        $id = DB::table('employees')->insertGetId([
            ...$data,
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $activityLogger->log($request->user(), 'hr.employee_created', null, $data);

        return response()->json(DB::table('employees')->find($id), 201);
    }

    public function updateEmployee(int $employee, Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hr.manage');

        $data = $request->validate([
            'name'       => ['sometimes', 'string', 'max:160'],
            'position'   => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'is_active'  => ['sometimes', 'boolean'],
            'pin'        => ['nullable', 'string', 'max:10'],
        ]);

        DB::table('employees')->where('id', $employee)->update([...$data, 'updated_at' => now()]);
        $activityLogger->log($request->user(), 'hr.employee_updated', null, $data);

        return DB::table('employees')->find($employee);
    }

    // ─── Attendance ─────────────────────────────────────────────────────────

    public function clockIn(Request $request)
    {
        $data = $request->validate([
            'pin' => ['required', 'string'],
        ]);

        $employee = DB::table('employees')
            ->where('pin', $data['pin'])
            ->where('is_active', true)
            ->first();

        if (! $employee) {
            return response()->json(['message' => 'PIN incorrecto o empleado inactivo.'], 422);
        }

        $today = now()->toDateString();

        $existing = DB::table('attendances')
            ->where('employee_id', $employee->id)
            ->where('work_date', $today)
            ->whereNull('clock_out')
            ->first();

        if ($existing) {
            // Clock out
            DB::table('attendances')->where('id', $existing->id)->update([
                'clock_out'  => now(),
                'updated_at' => now(),
            ]);
            return response()->json([
                'action'   => 'clock_out',
                'employee' => $employee->name,
                'time'     => now()->format('H:i:s'),
            ]);
        }

        // Clock in
        $id = DB::table('attendances')->insertGetId([
            'employee_id' => $employee->id,
            'work_date'   => $today,
            'clock_in'    => now(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json([
            'action'        => 'clock_in',
            'employee'      => $employee->name,
            'time'          => now()->format('H:i:s'),
            'attendance_id' => $id,
        ]);
    }

    public function attendances(Request $request, AccessControl $accessControl)
    {
        $accessControl->authorize($request->user(), 'hr.manage');

        $query = DB::table('attendances as a')
            ->join('employees as e', 'e.id', '=', 'a.employee_id')
            ->select('a.*', 'e.name as employee_name', 'e.department')
            ->orderByDesc('a.work_date')
            ->orderByDesc('a.clock_in');

        if ($request->filled('employee_id')) {
            $query->where('a.employee_id', $request->integer('employee_id'));
        }
        if ($request->filled('from')) {
            $query->where('a.work_date', '>=', $request->string('from'));
        }
        if ($request->filled('to')) {
            $query->where('a.work_date', '<=', $request->string('to'));
        }

        return $query->paginate($request->integer('per_page', 30));
    }
}
