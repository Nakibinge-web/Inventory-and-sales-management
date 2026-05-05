<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::with(['category', 'supplier'])->get();
        return response()->json(['success' => true, 'data' => $products]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'sku'              => 'nullable|string|max:100',
            'barcode'          => 'nullable|string|max:100',
            'unit'             => 'nullable|string|max:50',
            'category_id'      => 'nullable|exists:categories,id',
            'new_category'     => 'nullable|string|max:255',
            'supplier_id'      => 'nullable|exists:suppliers,id',
            'stock'            => 'required|numeric|min:0',
            'cost_price'       => 'nullable|numeric|min:0',
            'price'            => 'required|numeric|min:0',
            'reorder_level'    => 'nullable|numeric|min:0',
            'description'      => 'nullable|string',
            'track_expiry'     => 'nullable|boolean',
            'manufacture_date' => 'nullable|date',
            'expiry_date'      => 'nullable|date|after_or_equal:manufacture_date',
            'image'            => 'nullable|image|max:2048',
        ]);

        // Create a new category on the fly if requested
        if (empty($validated['category_id']) && !empty($validated['new_category'])) {
            $category = Category::create([
                'name'      => $validated['new_category'],
                'tenant_id' => auth()->user()->tenant_id,
            ]);
            $validated['category_id'] = $category->id;
        }

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        $product = Product::create([
            'tenant_id'        => auth()->user()->tenant_id,
            'name'             => $validated['name'],
            'sku'              => $validated['sku'] ?? null,
            'barcode'          => $validated['barcode'] ?? null,
            'unit'             => $validated['unit'] ?? null,
            'category_id'      => $validated['category_id'] ?? null,
            'supplier_id'      => $validated['supplier_id'] ?? null,
            'stock'            => $validated['stock'],
            'cost_price'       => $validated['cost_price'] ?? null,
            'price'            => $validated['price'],
            'reorder_level'    => $validated['reorder_level'] ?? 0,
            'description'      => $validated['description'] ?? null,
            'track_expiry'     => $validated['track_expiry'] ?? false,
            'manufacture_date' => $validated['manufacture_date'] ?? null,
            'expiry_date'      => $validated['expiry_date'] ?? null,
            'image_path'       => $imagePath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data'    => $product->load(['category', 'supplier']),
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $product->load(['category', 'supplier'])]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'sometimes|required|string|max:255',
            'sku'              => 'nullable|string|max:100',
            'barcode'          => 'nullable|string|max:100',
            'unit'             => 'nullable|string|max:50',
            'category_id'      => 'nullable|exists:categories,id',
            'supplier_id'      => 'nullable|exists:suppliers,id',
            'stock'            => 'sometimes|required|numeric|min:0',
            'cost_price'       => 'nullable|numeric|min:0',
            'price'            => 'sometimes|required|numeric|min:0',
            'reorder_level'    => 'nullable|numeric|min:0',
            'description'      => 'nullable|string',
            'track_expiry'     => 'nullable|boolean',
            'manufacture_date' => 'nullable|date',
            'expiry_date'      => 'nullable|date|after_or_equal:manufacture_date',
            'image'            => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('products', 'public');
        }

        unset($validated['image']);
        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data'    => $product->load(['category', 'supplier']),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }
        $product->delete();
        return response()->json(['success' => true, 'message' => 'Product deleted successfully']);
    }

    public function getLowStock(): JsonResponse
    {
        $products = Product::with(['category', 'supplier'])
            ->whereColumn('stock', '<=', 'reorder_level')
            ->get();

        return response()->json(['success' => true, 'data' => $products]);
    }
}
