<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Supplier;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CatalogController extends Controller
{
    public function categories(Request $request) { return Category::query()->latest()->paginate($request->integer('per_page', 50)); }
    public function brands(Request $request) { return Brand::query()->latest()->paginate($request->integer('per_page', 50)); }
    public function suppliers(Request $request) { return Supplier::query()->latest()->paginate($request->integer('per_page', 50)); }
    public function customers(Request $request)
    {
        return Customer::query()
            ->when(! $request->boolean('include_inactive'), fn ($query) => $query->where('is_active', true))
            ->latest()
            ->paginate($request->integer('per_page', 50));
    }
    public function branches(Request $request)
    {
        return Branch::query()
            ->when(! $request->boolean('include_inactive'), fn ($query) => $query->where('is_active', true))
            ->latest()
            ->paginate($request->integer('per_page', 50));
    }

    public function storeCategory(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'inventory.manage');

        $data = $request->validate(['name' => ['required', 'string', 'max:120'], 'parent_id' => ['nullable', 'exists:categories,id']]);
        $data['slug'] = Str::slug($data['name']) . '-' . Str::lower(Str::random(4));

        $category = Category::create($data);
        $activityLogger->log($request->user(), 'category.created', $category, ['name' => $category->name]);

        return $category;
    }

    public function storeBrand(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'inventory.manage');

        $brand = Brand::create($request->validate(['name' => ['required', 'string', 'max:120', 'unique:brands,name']]));
        $activityLogger->log($request->user(), 'brand.created', $brand, ['name' => $brand->name]);

        return $brand;
    }

    public function storeSupplier(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'inventory.manage');

        $supplier = Supplier::create($request->validate([
            'name' => ['required', 'string', 'max:160'],
            'contact_name' => ['nullable', 'string', 'max:160'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email'],
            'address' => ['nullable', 'string'],
        ]));
        $activityLogger->log($request->user(), 'supplier.created', $supplier, ['name' => $supplier->name]);

        return $supplier;
    }

    public function storeCustomer(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        $customer = Customer::create($request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'unique:customers,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'identification_type' => ['nullable', Rule::in(['01', '02', '03', '04'])],
            'identification_number' => ['nullable', 'string', 'max:12'],
            'province' => ['nullable', 'string', 'size:1'],
            'canton' => ['nullable', 'string', 'size:2'],
            'district' => ['nullable', 'string', 'size:2'],
            'barrio' => ['nullable', 'string', 'size:2'],
            'other_signs' => ['nullable', 'string'],
        ]));
        $activityLogger->log($request->user(), 'customer.created', $customer, [
            'name' => $customer->name,
            'identification_number' => $customer->identification_number,
        ]);

        return $customer;
    }

    public function updateCustomer(Request $request, Customer $customer, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        $before = $customer->only(['name', 'email', 'phone', 'identification_number', 'is_active']);
        $customer->update($request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['nullable', 'email', Rule::unique('customers', 'email')->ignore($customer->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'identification_type' => ['nullable', Rule::in(['01', '02', '03', '04'])],
            'identification_number' => ['nullable', 'string', 'max:12'],
            'province' => ['nullable', 'string', 'size:1'],
            'canton' => ['nullable', 'string', 'size:2'],
            'district' => ['nullable', 'string', 'size:2'],
            'barrio' => ['nullable', 'string', 'size:2'],
            'other_signs' => ['nullable', 'string'],
        ]));
        $activityLogger->log($request->user(), 'customer.updated', $customer, [
            'before' => $before,
            'after' => $customer->only(['name', 'email', 'phone', 'identification_number', 'is_active']),
        ]);

        return $customer;
    }

    public function destroyCustomer(Request $request, Customer $customer, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'pos.sell');

        $customer->update(['is_active' => false]);
        $activityLogger->log($request->user(), 'customer.deactivated', $customer, ['name' => $customer->name]);

        return response()->noContent();
    }

    public function storeBranch(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $branch = Branch::create($request->validate([
            'name' => ['required', 'string', 'max:160'],
            'code' => ['required', 'string', 'max:40', 'unique:branches,code'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email'],
            'address' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]));
        $activityLogger->log($request->user(), 'branch.created', $branch, ['code' => $branch->code, 'name' => $branch->name]);

        return $branch;
    }

    public function updateBranch(Request $request, Branch $branch, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $before = $branch->only(['name', 'code', 'phone', 'email', 'is_active']);
        $branch->update($request->validate([
            'name' => ['required', 'string', 'max:160'],
            'code' => ['required', 'string', 'max:40', Rule::unique('branches', 'code')->ignore($branch->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email'],
            'address' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]));
        $activityLogger->log($request->user(), 'branch.updated', $branch, [
            'before' => $before,
            'after' => $branch->only(['name', 'code', 'phone', 'email', 'is_active']),
        ]);

        return $branch;
    }

    public function destroyBranch(Request $request, Branch $branch, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $branch->update(['is_active' => false]);
        $activityLogger->log($request->user(), 'branch.deactivated', $branch, ['code' => $branch->code, 'name' => $branch->name]);

        return response()->noContent();
    }
}
