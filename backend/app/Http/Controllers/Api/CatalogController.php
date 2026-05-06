<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CatalogController extends Controller
{
    public function categories(Request $request) { return Category::query()->latest()->paginate($request->integer('per_page', 50)); }
    public function brands(Request $request) { return Brand::query()->latest()->paginate($request->integer('per_page', 50)); }
    public function suppliers(Request $request) { return Supplier::query()->latest()->paginate($request->integer('per_page', 50)); }
    public function customers(Request $request) { return Customer::query()->latest()->paginate($request->integer('per_page', 50)); }

    public function storeCategory(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120'], 'parent_id' => ['nullable', 'exists:categories,id']]);
        $data['slug'] = Str::slug($data['name']) . '-' . Str::lower(Str::random(4));

        return Category::create($data);
    }

    public function storeBrand(Request $request)
    {
        return Brand::create($request->validate(['name' => ['required', 'string', 'max:120', 'unique:brands,name']]));
    }

    public function storeSupplier(Request $request)
    {
        return Supplier::create($request->validate([
            'name' => ['required', 'string', 'max:160'],
            'contact_name' => ['nullable', 'string', 'max:160'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email'],
            'address' => ['nullable', 'string'],
        ]));
    }

    public function storeCustomer(Request $request)
    {
        return Customer::create($request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'unique:customers,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
        ]));
    }
}
