<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
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

    public function upsert(Request $request)
    {
        $data = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'key' => ['required', 'string', 'max:120'],
            'value' => ['nullable'],
            'group' => ['required', 'string', 'max:80'],
        ]);

        return Setting::updateOrCreate(
            ['branch_id' => $data['branch_id'] ?? null, 'key' => $data['key']],
            ['value' => $data['value'] ?? null, 'group' => $data['group']],
        );
    }
}
