<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * Display products for a specific tenant.
     * GET /api/products?tenant_id=1
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->query('tenant_id');
        
        $products = Product::where('tenant_id', $tenantId)
                          ->with(['category', 'supplier'])
                          ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Create a new product.
     * POST /api/products
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'stock' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'reorder_level' => 'nullable|integer|min:0'
        ]);

        $product = Product::create($validated);
        $product->load(['category', 'supplier']);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product
        ], 201);
    }

    /**
     * Display specific product.
     * GET /api/products/{id}
     */
    public function show(Product $product): JsonResponse
    {
        $product->load(['category', 'supplier']);
        
        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    /**
     * Update product.
     * PUT /api/products/{id}
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'stock' => 'sometimes|required|integer|min:0',
            'price' => 'sometimes|required|numeric|min:0',
            'reorder_level' => 'nullable|integer|min:0'
        ]);

        $product->update($validated);
        $product->load(['category', 'supplier']);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product
        ]);
    }

    /**
     * Delete product.
     * DELETE /api/products/{id}
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }

    /**
     * Get low stock products.
     * GET /api/products/low-stock?tenant_id=1
     */
    public function getLowStock(Request $request): JsonResponse
    {
        $tenantId = $request->query('tenant_id');
        
        $products = Product::where('tenant_id', $tenantId)
                          ->whereColumn('stock', '<=', 'reorder_level')
                          ->with(['category', 'supplier'])
                          ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
}