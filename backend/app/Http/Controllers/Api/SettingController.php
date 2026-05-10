<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $query = Setting::query()->orderBy('group')->orderBy('key');

        if ($group = $request->query('group')) {
            $query->where('group', $group);
        }

        return $query->get();
    }

    public function upsert(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $data = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'key' => ['required', 'string', 'max:120'],
            'value' => ['nullable'],
            'group' => ['required', 'string', 'max:80'],
        ]);

        $setting = Setting::updateOrCreate(
            ['branch_id' => $data['branch_id'] ?? null, 'key' => $data['key']],
            ['value' => $data['value'] ?? null, 'group' => $data['group']],
        );

        $activityLogger->log($request->user(), 'setting.saved', $setting, [
            'branch_id' => $setting->branch_id,
            'group' => $setting->group,
            'key' => $setting->key,
        ]);

        return $setting;
    }
}
