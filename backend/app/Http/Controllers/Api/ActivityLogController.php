<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\AccessControl;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request, AccessControl $accessControl)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        return ActivityLog::query()
            ->with('user:id,name,email')
            ->when($request->query('action'), fn ($query, $action) => $query->where('action', $action))
            ->when($request->query('subject_type'), fn ($query, $subjectType) => $query->where('subject_type', $subjectType))
            ->latest()
            ->paginate($request->integer('per_page', 30));
    }
}
