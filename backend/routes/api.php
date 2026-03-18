<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\StockMovementController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Test route
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()
    ]);
});

// Tenant Management Routes
Route::prefix('tenants')->group(function () {
    Route::get('/', [TenantController::class, 'index']);           // GET /api/tenants
    Route::post('/', [TenantController::class, 'store']);          // POST /api/tenants
    Route::get('/{tenant}', [TenantController::class, 'show']);    // GET /api/tenants/{id}
    Route::put('/{tenant}', [TenantController::class, 'update']);  // PUT /api/tenants/{id}
    Route::delete('/{tenant}', [TenantController::class, 'destroy']); // DELETE /api/tenants/{id}
});

// User Management Routes
Route::prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);            // GET /api/users?tenant_id=1
    Route::post('/', [UserController::class, 'store']);           // POST /api/users
    Route::get('/by-role', [UserController::class, 'getUsersByRole']); // GET /api/users/by-role?tenant_id=1&role=cashier
    Route::get('/{user}', [UserController::class, 'show']);       // GET /api/users/{id}
    Route::put('/{user}', [UserController::class, 'update']);     // PUT /api/users/{id}
    Route::delete('/{user}', [UserController::class, 'destroy']); // DELETE /api/users/{id}
});

// Category Management Routes
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);        // GET /api/categories?tenant_id=1
    Route::post('/', [CategoryController::class, 'store']);       // POST /api/categories
    Route::get('/{category}', [CategoryController::class, 'show']); // GET /api/categories/{id}
    Route::put('/{category}', [CategoryController::class, 'update']); // PUT /api/categories/{id}
    Route::delete('/{category}', [CategoryController::class, 'destroy']); // DELETE /api/categories/{id}
});

// Supplier Management Routes
Route::prefix('suppliers')->group(function () {
    Route::get('/', [SupplierController::class, 'index']);        // GET /api/suppliers?tenant_id=1
    Route::post('/', [SupplierController::class, 'store']);       // POST /api/suppliers
    Route::get('/{supplier}', [SupplierController::class, 'show']); // GET /api/suppliers/{id}
    Route::put('/{supplier}', [SupplierController::class, 'update']); // PUT /api/suppliers/{id}
    Route::delete('/{supplier}', [SupplierController::class, 'destroy']); // DELETE /api/suppliers/{id}
});

// Product Management Routes
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);         // GET /api/products?tenant_id=1
    Route::post('/', [ProductController::class, 'store']);        // POST /api/products
    Route::get('/low-stock', [ProductController::class, 'getLowStock']); // GET /api/products/low-stock?tenant_id=1
    Route::get('/{product}', [ProductController::class, 'show']); // GET /api/products/{id}
    Route::put('/{product}', [ProductController::class, 'update']); // PUT /api/products/{id}
    Route::delete('/{product}', [ProductController::class, 'destroy']); // DELETE /api/products/{id}
});

// Sales Management Routes
Route::prefix('sales')->group(function () {
    Route::get('/', [SaleController::class, 'index']);            // GET /api/sales?tenant_id=1
    Route::post('/', [SaleController::class, 'store']);           // POST /api/sales
    Route::get('/daily-report', [SaleController::class, 'getDailyReport']); // GET /api/sales/daily-report?tenant_id=1&date=2026-03-18
    Route::get('/{sale}', [SaleController::class, 'show']);       // GET /api/sales/{id}
});

// Purchase Management Routes
Route::prefix('purchases')->group(function () {
    Route::get('/', [PurchaseController::class, 'index']);        // GET /api/purchases?tenant_id=1
    Route::post('/', [PurchaseController::class, 'store']);       // POST /api/purchases
    Route::get('/monthly-report', [PurchaseController::class, 'getMonthlyReport']); // GET /api/purchases/monthly-report?tenant_id=1&month=2026-03
    Route::get('/{purchase}', [PurchaseController::class, 'show']); // GET /api/purchases/{id}
});

// Stock Movement Routes
Route::prefix('stock-movements')->group(function () {
    Route::get('/', [StockMovementController::class, 'index']);   // GET /api/stock-movements?tenant_id=1
    Route::get('/product/{productId}', [StockMovementController::class, 'getByProduct']); // GET /api/stock-movements/product/{productId}?tenant_id=1
    Route::get('/by-type', [StockMovementController::class, 'getByType']); // GET /api/stock-movements/by-type?tenant_id=1&type=IN
    Route::get('/date-range', [StockMovementController::class, 'getByDateRange']); // GET /api/stock-movements/date-range?tenant_id=1&start_date=2026-03-01&end_date=2026-03-31
    Route::get('/{stockMovement}', [StockMovementController::class, 'show']); // GET /api/stock-movements/{id}
});

// Health Check Route
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'Inventory & Sales Management API',
        'version' => '1.0.0',
        'status' => 'healthy',
        'timestamp' => now(),
        'endpoints' => [
            'tenants' => '/api/tenants',
            'users' => '/api/users',
            'categories' => '/api/categories',
            'suppliers' => '/api/suppliers',
            'products' => '/api/products',
            'sales' => '/api/sales',
            'purchases' => '/api/purchases',
            'stock-movements' => '/api/stock-movements'
        ]
    ]);
});