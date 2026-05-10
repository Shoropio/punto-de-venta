<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarcodeController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\CashMovementController;
use App\Http\Controllers\Api\CashSessionController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CreditPaymentController;
use App\Http\Controllers\Api\HaciendaSettingController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\RefundController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SettingController;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user()->load(['role.permissions', 'branch']));
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/products/identifiers', [ProductController::class, 'identifiers']);
    Route::apiResource('products', ProductController::class);

    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::post('/categories', [CatalogController::class, 'storeCategory']);
    Route::get('/brands', [CatalogController::class, 'brands']);
    Route::post('/brands', [CatalogController::class, 'storeBrand']);
    Route::get('/suppliers', [CatalogController::class, 'suppliers']);
    Route::post('/suppliers', [CatalogController::class, 'storeSupplier']);
    Route::get('/customers', [CatalogController::class, 'customers']);
    Route::post('/customers', [CatalogController::class, 'storeCustomer']);
    Route::put('/customers/{customer}', [CatalogController::class, 'updateCustomer']);
    Route::delete('/customers/{customer}', [CatalogController::class, 'destroyCustomer']);
    Route::get('/branches', [CatalogController::class, 'branches']);
    Route::post('/branches', [CatalogController::class, 'storeBranch']);
    Route::put('/branches/{branch}', [CatalogController::class, 'updateBranch']);
    Route::delete('/branches/{branch}', [CatalogController::class, 'destroyBranch']);

    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'upsert']);
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/hacienda-settings', [HaciendaSettingController::class, 'index']);
    Route::post('/hacienda-settings', [HaciendaSettingController::class, 'store']);
    Route::put('/hacienda-settings/{haciendaSetting}', [HaciendaSettingController::class, 'update']);

    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
    Route::post('/payment-methods', [PaymentMethodController::class, 'store']);
    Route::put('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update']);

    Route::get('/cash-sessions/current', [CashSessionController::class, 'current']);
    Route::get('/cash-registers', [CashSessionController::class, 'registers']);
    Route::post('/cash-sessions/open', [CashSessionController::class, 'open']);
    Route::get('/cash-sessions/{cashSession}/summary', [CashSessionController::class, 'summary']);
    Route::post('/cash-sessions/{cashSession}/close', [CashSessionController::class, 'close']);
    Route::get('/cash-movements', [CashMovementController::class, 'index']);
    Route::post('/cash-movements', [CashMovementController::class, 'store']);

    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/{sale}', [SaleController::class, 'show']);
    Route::post('/sales/{sale}/cancel', [SaleController::class, 'cancel']);

    Route::get('/credit-payments', [CreditPaymentController::class, 'index']);
    Route::post('/credit-payments', [CreditPaymentController::class, 'store']);

    Route::get('/promotions', [PromotionController::class, 'index']);
    Route::post('/promotions', [PromotionController::class, 'store']);

    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::post('/invoices/{invoice}/xml', [InvoiceController::class, 'generateXml']);
    Route::post('/invoices/{invoice}/sign', [InvoiceController::class, 'sign']);
    Route::post('/invoices/{invoice}/submit', [InvoiceController::class, 'submit']);
    Route::post('/invoices/{invoice}/status', [InvoiceController::class, 'checkStatus']);

    Route::get('/barcodes/generate', [BarcodeController::class, 'generate']);
    Route::post('/products/{product}/barcode', [BarcodeController::class, 'assign']);

    Route::get('/refunds', [RefundController::class, 'index']);
    Route::post('/refunds', [RefundController::class, 'store']);

    Route::get('/stock-movements', [InventoryController::class, 'movements']);
    Route::post('/stock-movements', [InventoryController::class, 'move']);

    Route::get('/reports/sales-summary', [ReportController::class, 'salesSummary']);
    Route::get('/reports/top-products', [ReportController::class, 'topProducts']);
    Route::get('/reports/inventory', [ReportController::class, 'inventory']);

    Route::get('/backups', [BackupController::class, 'index']);
    Route::post('/backups', [BackupController::class, 'store']);
    Route::get('/backups/{backup}', [BackupController::class, 'download']);
    Route::delete('/backups/{backup}', [BackupController::class, 'destroy']);
});
