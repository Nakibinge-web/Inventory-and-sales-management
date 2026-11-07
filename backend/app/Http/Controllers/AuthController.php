<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        // Accept 'login' (email or username) with backward-compat fallback to 'email'
        $loginValue = $request->input('login') ?? $request->input('email');

        $request->validate([
            'password' => 'required|string',
        ]);

        $isApi = $request->wantsJson() || $request->isJson() || $request->expectsJson();

        if (empty($loginValue)) {
            if ($isApi) {
                return response()->json([
                    'success' => false,
                    'message' => 'The email or username field is required.',
                ], 422);
            }
            throw ValidationException::withMessages([
                'login' => 'The email or username field is required.',
            ]);
        }

        $key = 'login:' . $request->ip();

        // Max 5 attempts per minute
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            if ($isApi) {
                return response()->json([
                    'success' => false,
                    'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
                ], 429);
            }
            throw ValidationException::withMessages([
                'login' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        // Normalize to lowercase for comparison
        $loginNormalized = strtolower(trim($loginValue));

        // Look up by email or username so staff can log in with either identifier
        $user = User::where('email', $loginNormalized)
                    ->orWhere('username', $loginNormalized)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, 60);

            if ($isApi) {
                return response()->json([
                    'success' => false,
                    'message' => 'The provided credentials do not match our records.',
                ], 401);
            }

            return back()->withErrors([
                'login' => 'The provided credentials do not match our records.',
            ]);
        }

        // Credentials matched — check account status before creating a session
        if (!$user->is_active) {
            RateLimiter::hit($key, 60);
            if ($isApi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been disabled. Please contact your administrator.',
                ], 403);
            }
            return back()->withErrors(['login' => 'Your account has been disabled.']);
        }

        // Account is active — log the user in and clear the rate limiter
        Auth::login($user);
        RateLimiter::clear($key);

        if (!$isApi) {
            $request->session()->regenerate();
            return redirect()->intended('/');
        }

        $user->load('roles.permissions:id,name', 'tenant');
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'user'    => $user,
            'token'   => $token,
            'message' => 'Login successful.',
        ]);
    }

    public function showRegisterForm()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        // Normalize username to lowercase before validation so the unique check
        // fires on the lowercase value (handles case-insensitive duplicate detection)
        if ($request->has('username')) {
            $request->merge(['username' => strtolower(trim($request->username))]);
        }

        $logoRule = 'nullable';
        if ($request->hasFile('logo')) {
            $logoRule = 'file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120';
        } elseif ($request->filled('logo') && is_string($request->logo)) {
            $logoRule = ['string', 'regex:/^data:image\/(jpeg|png|jpg|gif|svg\+xml|webp);base64,/i'];
        }

        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users',
            'username'      => 'required|string|min:3|max:30|regex:/^[a-zA-Z0-9_]+$/|unique:users',
            'password'      => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()->uncompromised()],
            'business_name' => 'required|string|max:255',
            'phone'         => 'nullable|string|max:20',
            'address'       => 'nullable|string',
            'logo'          => $logoRule,
        ]);

        $logoPath = null;
        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            $logoPath = $request->file('logo')->store('logos', 'public');
        } elseif ($request->filled('logo') && is_string($request->logo)) {
            $allowedExtensions = [
                'jpeg'    => 'jpg',
                'jpg'     => 'jpg',
                'png'     => 'png',
                'gif'     => 'gif',
                'webp'    => 'webp',
                'svg+xml' => 'svg',
                'svg'     => 'svg',
            ];

            if (preg_match('/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,/', $request->logo, $matches)) {
                $subtype = strtolower($matches[1]);
                if (isset($allowedExtensions[$subtype])) {
                    $ext = $allowedExtensions[$subtype];
                    $base64Data = substr($request->logo, strpos($request->logo, ',') + 1);
                    $decoded = base64_decode($base64Data, true);

                    // Verify valid decoded binary data within 5MB limit
                    if ($decoded !== false && strlen($decoded) > 0 && strlen($decoded) <= 5242880) {
                        $fileName = 'logos/' . \Illuminate\Support\Str::random(40) . '.' . $ext;
                        \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $decoded);
                        $logoPath = $fileName;
                    }
                }
            }
        }

        // Check if this email already completed a NexumPay subscription payment
        $paidSub = null;
        try {
            $paidSub = \Illuminate\Support\Facades\Cache::get('nexumpay_paid_sub_' . strtolower(trim($request->email)));
            if (!$paidSub) {
                $paidTx = \App\Models\NexumPayTransaction::where('customer_email', $request->email)
                    ->where('status', 'SUCCESSFUL')
                    ->latest()
                    ->first();
                if ($paidTx) {
                    $months = ($paidTx->billing_cycle === 'annual') ? 12 : 1;
                    $paidSub = [
                        'subscription_plan'       => $paidTx->plan_id,
                        'subscription_status'     => 'active',
                        'subscription_expires_at' => now()->addMonths($months),
                    ];
                }
            }
        } catch (\Exception $e) {
            // Ignore if table/columns not migrated yet
        }

        $tenantAttributes = [
            'name'      => $request->business_name,
            'email'     => $request->email,
            'phone'     => $request->phone,
            'address'   => $request->address,
            'logo_path' => $logoPath,
        ];

        if ($paidSub) {
            $tenantAttributes['subscription_plan']       = $paidSub['subscription_plan'];
            $tenantAttributes['subscription_status']     = 'active';
            $tenantAttributes['subscription_expires_at'] = $paidSub['subscription_expires_at'];
        } elseif ($request->filled('subscription_plan')) {
            $tenantAttributes['subscription_plan']       = $request->subscription_plan;
            $tenantAttributes['subscription_status']     = $request->subscription_plan === 'trial' ? 'trial' : 'pending';
            $tenantAttributes['subscription_expires_at'] = $request->subscription_plan === 'trial' ? now()->addDays(14) : null;
        }

        // Create a new tenant for the user
        try {
            $tenant = \App\Models\Tenant::create($tenantAttributes);
        } catch (\Exception $e) {
            // Fallback if subscription columns haven't been migrated yet
            $tenant = \App\Models\Tenant::create([
                'name'      => $request->business_name,
                'email'     => $request->email,
                'phone'     => $request->phone,
                'address'   => $request->address,
                'logo_path' => $logoPath,
            ]);
        }

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name'      => $request->name,
            'email'     => $request->email,
            'username'  => $request->username,
            'password'  => Hash::make($request->password),
        ]);

        // Assign the default 'owner' role
        $ownerRole = \App\Models\Role::where('name', 'owner')->whereNull('tenant_id')->first();
        if ($ownerRole) {
            $user->roles()->attach($ownerRole->id);
        }
        
        $user->load('roles', 'tenant');
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'user' => $user,
            'token' => $token,
            'message' => 'Registration successful.',
        ], 201);
    }

    public function logout(Request $request)
    {
        if ($request->wantsJson() || $request->isJson() || $request->expectsJson()) {
            $request->user('sanctum')?->currentAccessToken()->delete();
            return response()->json(['success' => true, 'message' => 'Logged out successfully.']);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
