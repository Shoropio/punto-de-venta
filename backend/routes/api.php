<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CashSessionController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user()->load(['role.permissions', 'branch']));
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::apiResource('products', ProductController::class);

    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::post('/categories', [CatalogController::class, 'storeCategory']);
    Route::get('/brands', [CatalogController::class, 'brands']);
    Route::post('/brands', [CatalogController::class, 'storeBrand']);
    Route::get('/suppliers', [CatalogController::class, 'suppliers']);
    Route::post('/suppliers', [CatalogController::class, 'storeSupplier']);
    Route::get('/customers', [CatalogController::class, 'customers']);
    Route::post('/customers', [CatalogController::class, 'storeCustomer']);

    Route::get('/cash-sessions/current', [CashSessionController::class, 'current']);
    Route::post('/cash-sessions/open', [CashSessionController::class, 'open']);
    Route::post('/cash-sessions/{cashSession}/close', [CashSessionController::class, 'close']);

    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/{sale}', [SaleController::class, 'show']);
    Route::post('/sales/{sale}/cancel', [SaleController::class, 'cancel']);

    Route::get('/stock-movements', [InventoryController::class, 'movements']);
    Route::post('/stock-movements', [InventoryController::class, 'move']);

    Route::get('/reports/sales-summary', [ReportController::class, 'salesSummary']);
    Route::get('/reports/top-products', [ReportController::class, 'topProducts']);
    Route::get('/reports/inventory', [ReportController::class, 'inventory']);
});
