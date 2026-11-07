<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class QuotationController extends Controller
{
    // ── List ─────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $isPrivileged = $user->roles()->pluck('name')
            ->intersect(['owner', 'admin', 'manager'])
            ->isNotEmpty();

        $query = Quotation::with(['user:id,name,email', 'customer', 'tenant'])
            ->orderBy('quotation_date', 'desc')
            ->orderBy('id', 'desc');

        if (!$isPrivileged) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('quotation_number', 'like', "%{$s}%")
                  ->orWhere('customer_name', 'like', "%{$s}%")
                  ->orWhere('customer_phone', 'like', "%{$s}%");
            });
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'quotation_date'   => 'required|date',
            'valid_until'      => 'nullable|date',
            'customer_id'      => 'nullable|exists:customers,id',
            'customer_name'    => 'required|string|max:255',
            'customer_phone'   => 'nullable|string|max:50',
            'customer_email'   => 'nullable|email|max:255',
            'customer_address' => 'nullable|string|max:500',
            'items'            => 'required|array|min:1',
            'items.*.description' => 'required|string|max:500',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.price'       => 'required|numeric|min:0',
            'items.*.subtotal'    => 'nullable|numeric|min:0',
            'items.*.product_id'  => 'nullable',
            'discount_amount'  => 'nullable|numeric|min:0',
            'tax_amount'       => 'nullable|numeric|min:0',
            'status'           => 'nullable|in:pending,accepted,declined,expired,converted',
            'notes'            => 'nullable|string|max:2000',
            'terms'            => 'nullable|string|max:2000',
        ]);

        $subtotal = array_sum(array_map(
            fn($i) => ($i['subtotal'] ?? (floatval($i['quantity']) * floatval($i['price']))),
            $validated['items']
        ));

        $discount    = floatval($validated['discount_amount'] ?? 0);
        $tax         = floatval($validated['tax_amount'] ?? 0);
        $totalAmount = max(0, $subtotal - $discount + $tax);

        $quotationNumber = $this->generateQuotationNumber();

        $items = array_map(function ($i) {
            $qty = floatval($i['quantity']);
            $price = floatval($i['price']);
            return [
                'product_id'  => $i['product_id'] ?? null,
                'description' => $i['description'],
                'quantity'    => $qty,
                'price'       => $price,
                'subtotal'    => $i['subtotal'] ?? ($qty * $price),
            ];
        }, $validated['items']);

        $quotation = Quotation::create([
            'user_id'          => Auth::id(),
            'customer_id'      => $validated['customer_id'] ?? null,
            'quotation_number' => $quotationNumber,
            'quotation_date'   => $validated['quotation_date'],
            'valid_until'      => $validated['valid_until'] ?? null,
            'customer_name'    => $validated['customer_name'],
            'customer_phone'   => $validated['customer_phone'] ?? null,
            'customer_email'   => $validated['customer_email'] ?? null,
            'customer_address' => $validated['customer_address'] ?? null,
            'subtotal'         => $subtotal,
            'discount_amount'  => $discount,
            'tax_amount'       => $tax,
            'total_amount'     => $totalAmount,
            'status'           => $validated['status'] ?? 'pending',
            'items'            => $items,
            'notes'            => $validated['notes'] ?? null,
            'terms'            => $validated['terms'] ?? '1. Quotation valid for 14 days from issue date.' . "\n" . '2. Delivery terms to be agreed upon confirmation.' . "\n" . '3. Prices inclusive of relevant local taxes where applicable.',
        ]);

        $quotation->load(['user:id,name,email', 'customer', 'tenant']);

        return response()->json([
            'success' => true,
            'message' => 'Quotation created successfully.',
            'data'    => $quotation,
        ], 201);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(Quotation $quotation): JsonResponse
    {
        $quotation->load(['user:id,name,email', 'customer', 'tenant']);
        return response()->json(['success' => true, 'data' => $quotation]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, Quotation $quotation): JsonResponse
    {
        $validated = $request->validate([
            'quotation_date'   => 'sometimes|required|date',
            'valid_until'      => 'nullable|date',
            'customer_id'      => 'nullable|exists:customers,id',
            'customer_name'    => 'sometimes|required|string|max:255',
            'customer_phone'   => 'nullable|string|max:50',
            'customer_email'   => 'nullable|email|max:255',
            'customer_address' => 'nullable|string|max:500',
            'items'            => 'sometimes|required|array|min:1',
            'items.*.description' => 'required|string|max:500',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.price'       => 'required|numeric|min:0',
            'items.*.subtotal'    => 'nullable|numeric|min:0',
            'items.*.product_id'  => 'nullable',
            'discount_amount'  => 'nullable|numeric|min:0',
            'tax_amount'       => 'nullable|numeric|min:0',
            'status'           => 'nullable|in:pending,accepted,declined,expired,converted',
            'notes'            => 'nullable|string|max:2000',
            'terms'            => 'nullable|string|max:2000',
        ]);

        if (isset($validated['items'])) {
            $validated['subtotal'] = array_sum(array_map(
                fn($i) => ($i['subtotal'] ?? (floatval($i['quantity']) * floatval($i['price']))),
                $validated['items']
            ));
            $validated['items'] = array_map(function ($i) {
                $qty = floatval($i['quantity']);
                $price = floatval($i['price']);
                return [
                    'product_id'  => $i['product_id'] ?? null,
                    'description' => $i['description'],
                    'quantity'    => $qty,
                    'price'       => $price,
                    'subtotal'    => $i['subtotal'] ?? ($qty * $price),
                ];
            }, $validated['items']);
        } else {
            $validated['subtotal'] = $quotation->subtotal;
        }

        $discount = isset($validated['discount_amount']) ? floatval($validated['discount_amount']) : $quotation->discount_amount;
        $tax      = isset($validated['tax_amount']) ? floatval($validated['tax_amount']) : $quotation->tax_amount;
        $validated['total_amount'] = max(0, $validated['subtotal'] - $discount + $tax);

        $quotation->update($validated);
        $quotation->load(['user:id,name,email', 'customer', 'tenant']);

        return response()->json([
            'success' => true,
            'message' => 'Quotation updated successfully.',
            'data'    => $quotation,
        ]);
    }

    // ── Update Status ─────────────────────────────────────────────────────────

    public function updateStatus(Request $request, Quotation $quotation): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,accepted,declined,expired,converted',
        ]);

        $quotation->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => "Quotation status updated to {$validated['status']}.",
            'data'    => $quotation,
        ]);
    }

    // ── Convert Quotation to Invoice ─────────────────────────────────────────

    public function convertToInvoice(Request $request, Quotation $quotation): JsonResponse
    {
        $year     = date('y');
        $nextYear = (int)$year + 1;
        $prefix   = "INV/{$year}-{$nextYear}/";

        $last = Invoice::where('invoice_number', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->value('invoice_number');

        $seq = $last ? ((int)substr($last, strlen($prefix)) + 1) : 1;
        $invoiceNumber = $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);

        $invoice = Invoice::create([
            'user_id'          => Auth::id(),
            'invoice_number'   => $invoiceNumber,
            'invoice_date'     => now()->toDateString(),
            'due_date'         => $quotation->valid_until ?? now()->addDays(14)->toDateString(),
            'source_ref'       => $quotation->quotation_number,
            'customer_name'    => $quotation->customer_name,
            'customer_phone'   => $quotation->customer_phone,
            'customer_email'   => $quotation->customer_email,
            'customer_address' => $quotation->customer_address,
            'subtotal'         => $quotation->subtotal,
            'discount_amount'  => $quotation->discount_amount,
            'tax_amount'       => $quotation->tax_amount,
            'total_amount'     => $quotation->total_amount,
            'amount_paid'      => 0,
            'payment_status'   => 'due',
            'items'            => $quotation->items,
            'notes'            => "Converted from Quotation {$quotation->quotation_number}. " . ($quotation->notes ?? ''),
        ]);

        $quotation->update(['status' => 'converted']);

        return response()->json([
            'success' => true,
            'message' => "Quotation converted to Invoice {$invoiceNumber} successfully.",
            'data'    => [
                'quotation' => $quotation,
                'invoice'   => $invoice,
            ],
        ]);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public function destroy(Quotation $quotation): JsonResponse
    {
        $user = Auth::user();

        $isPrivileged = $user->roles()->pluck('name')
            ->intersect(['owner', 'admin', 'manager'])
            ->isNotEmpty();

        if (!$isPrivileged && $quotation->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to delete this quotation.'], 403);
        }

        $quotation->delete();

        return response()->json(['success' => true, 'message' => 'Quotation deleted successfully.']);
    }

    // ── Helper: generate quotation number ─────────────────────────────────────

    private function generateQuotationNumber(): string
    {
        $year     = date('y');
        $nextYear = (int)$year + 1;
        $prefix   = "QT/{$year}-{$nextYear}/";

        $last = Quotation::where('quotation_number', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->value('quotation_number');

        if ($last) {
            $seq = (int)substr($last, strlen($prefix)) + 1;
        } else {
            $seq = 1;
        }

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}

