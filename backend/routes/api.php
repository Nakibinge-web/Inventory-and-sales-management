<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\StockMovementController;

use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;

// Public auth routes — no token required
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// All other routes require a valid Sanctum token + tenant resolution
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);

    // Test
    Route::get('/test', function () {
        return response()->json(['success' => true, 'message' => 'API is working!', 'timestamp' => now()]);
    });

    // Health Check
    Route::get('/health', function () {
        return response()->json([
            'success' => true,
            'message' => 'Inventory & Sales Management API',
            'version' => '1.0.0',
            'status' => 'healthy',
            'timestamp' => now(),
            'endpoints' => [
                'tenants'         => '/api/tenants',
                'users'           => '/api/users',
                'categories'      => '/api/categories',
                'suppliers'       => '/api/suppliers',
                'products'        => '/api/products',
                'sales'           => '/api/sales',
                'purchases'       => '/api/purchases',
                'stock-movements' => '/api/stock-movements',
            ],
        ]);
    });

    // Roles
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::post('/', [RoleController::class, 'store']);
        Route::post('/assign', [RoleController::class, 'assign']);
        Route::delete('/revoke', [RoleController::class, 'revoke']);
        Route::get('/{role}', [RoleController::class, 'show']);
        Route::put('/{role}', [RoleController::class, 'update']);
        Route::delete('/{role}', [RoleController::class, 'destroy']);
    });

    // Permissions
    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::post('/assign', [PermissionController::class, 'assign']);
        Route::delete('/revoke', [PermissionController::class, 'revoke']);
        Route::get('/{permission}', [PermissionController::class, 'show']);
        Route::put('/{permission}', [PermissionController::class, 'update']);
        Route::delete('/{permission}', [PermissionController::class, 'destroy']);
    });

    // Tenants
    Route::prefix('tenants')->group(function () {
        Route::get('/', [TenantController::class, 'index']);
        Route::post('/', [TenantController::class, 'store']);
        Route::get('/{tenant}', [TenantController::class, 'show']);
        Route::put('/{tenant}', [TenantController::class, 'update']);
        Route::delete('/{tenant}', [TenantController::class, 'destroy']);
    });

    // Users
    Route::prefix('users')->group(function () {
        Route::get('/',         [UserController::class, 'index']);
        Route::get('/me',       [UserController::class, 'me']);
        Route::get('/by-role',  [UserController::class, 'getUsersByRole']);
        Route::get('/{user}',   [UserController::class, 'show']);

        // Only owners and admins can create, update, or delete users
        Route::middleware('role:owner,admin')->group(function () {
            Route::post('/',          [UserController::class, 'store']);
            Route::put('/{user}',     [UserController::class, 'update']);
            Route::delete('/{user}',  [UserController::class, 'destroy']);
        });
    });

    // Categories
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::get('/{category}', [CategoryController::class, 'show']);
        Route::put('/{category}', [CategoryController::class, 'update']);
        Route::delete('/{category}', [CategoryController::class, 'destroy']);
    });

    // Suppliers
    Route::prefix('suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index']);
        Route::post('/', [SupplierController::class, 'store']);
        Route::get('/{supplier}', [SupplierController::class, 'show']);
        Route::put('/{supplier}', [SupplierController::class, 'update']);
        Route::delete('/{supplier}', [SupplierController::class, 'destroy']);
    });

    // Products
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
        Route::get('/low-stock', [ProductController::class, 'getLowStock']);
        Route::get('/{product}', [ProductController::class, 'show']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
    });

    // Sales
    Route::prefix('sales')->group(function () {
        Route::get('/', [SaleController::class, 'index']);
        Route::post('/', [SaleController::class, 'store']);
        Route::get('/daily-report', [SaleController::class, 'getDailyReport']);
        Route::get('/{sale}', [SaleController::class, 'show']);
    });

    // Purchases
    Route::prefix('purchases')->group(function () {
        Route::get('/', [PurchaseController::class, 'index']);
        Route::post('/', [PurchaseController::class, 'store']);
        Route::get('/monthly-report', [PurchaseController::class, 'getMonthlyReport']);
        Route::get('/{purchase}', [PurchaseController::class, 'show']);
    });

    // Stock Movements
    Route::prefix('stock-movements')->group(function () {
        Route::get('/', [StockMovementController::class, 'index']);
        Route::get('/product/{productId}', [StockMovementController::class, 'getByProduct']);
        Route::get('/by-type', [StockMovementController::class, 'getByType']);
        Route::get('/date-range', [StockMovementController::class, 'getByDateRange']);
        Route::get('/{stockMovement}', [StockMovementController::class, 'show']);
    });
});
