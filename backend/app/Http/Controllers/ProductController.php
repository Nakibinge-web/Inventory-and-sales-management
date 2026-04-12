<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Product::with(['category', 'supplier'])->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'category_id'   => 'nullable|exists:categories,id',
            'supplier_id'   => 'nullable|exists:suppliers,id',
            'stock'         => 'required|integer|min:0',
            'price'         => 'required|numeric|min:0',
            'reorder_level' => 'nullable|integer|min:0',
        ]);

        $product = Product::create($validated);
        $product->load(['category', 'supplier']);

        return response()->json(['success' => true, 'message' => 'Product created successfully', 'data' => $product], 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['category', 'supplier']);

        return response()->json(['success' => true, 'data' => $product]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'sometimes|required|string|max:255',
            'category_id'   => 'nullable|exists:categories,id',
            'supplier_id'   => 'nullable|exists:suppliers,id',
            'stock'         => 'sometimes|required|integer|min:0',
            'price'         => 'sometimes|required|numeric|min:0',
            'reorder_level' => 'nullable|integer|min:0',
        ]);

        $product->update($validated);
        $product->load(['category', 'supplier']);

        return response()->json(['success' => true, 'message' => 'Product updated successfully', 'data' => $product]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['success' => true, 'message' => 'Product deleted successfully']);
    }

    public function getLowStock(): JsonResponse
    {
        $products = Product::whereColumn('stock', '<=', 'reorder_level')
                           ->with(['category', 'supplier'])
                           ->get();

        return response()->json(['success' => true, 'data' => $products]);
    }
}
