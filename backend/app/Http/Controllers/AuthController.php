<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use App\Jobs\SendPasswordResetOtpJob;
use App\Mail\PasswordResetOtpMailable;
use App\Models\PasswordResetOtp;
use App\Models\Tenant;
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
        if (isset($user->is_active) && !$user->is_active) {
            RateLimiter::hit($key, 60);
            if ($isApi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been disabled. Please contact your system administrator.',
                ], 403);
            }
            return back()->withErrors(['login' => 'Your account has been disabled.']);
        }

        // Check tenant existence and whether its subscription period has ended
        $tenant = Tenant::find($user->tenant_id);
        if (!$tenant) {
            if ($isApi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Business account not found. Please contact support.',
                ], 403);
            }
            return back()->withErrors(['login' => 'Business account not found. Please contact support.']);
        }

        if ($tenant->isSubscriptionExpired()) {
            RateLimiter::clear($key);
            $isOwner = $user->hasRole('owner');
            if ($isApi) {
                return response()->json($tenant->subscriptionBlockedPayload($isOwner, true), 403);
            }
            return back()->withErrors(['login' => $tenant->expiredSubscriptionMessage($isOwner)]);
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
                    $days = \App\Models\Tenant::durationDaysForCycle($paidTx->billing_cycle);
                    $paidSub = [
                        'subscription_plan'       => $paidTx->plan_id,
                        'subscription_status'     => 'active',
                        'subscription_expires_at' => now()->addDays($days),
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

    /**
     * Resolve a business owner account and its tenant by email address.
     *
     * @return array{0: ?User, 1: ?Tenant, 2: ?string, 3: int}
     */
    private function resolveOwnerByEmail(string $rawEmail): array
    {
        $email = strtolower(trim($rawEmail));

        $user = User::withoutGlobalScopes()
            ->where('email', $email)
            ->first();

        if (!$user) {
            $tenantByEmail = Tenant::where('email', $email)->first();
            if ($tenantByEmail) {
                $user = User::withoutGlobalScopes()
                    ->where('tenant_id', $tenantByEmail->id)
                    ->whereHas('roles', fn ($q) => $q->where('name', 'owner'))
                    ->first()
                    ?? User::withoutGlobalScopes()
                        ->where('tenant_id', $tenantByEmail->id)
                        ->whereNull('created_by')
                        ->orderBy('id')
                        ->first();
            }
        }

        if (!$user) {
            return [null, null, 'We could not find a business owner account with that email address.', 404];
        }

        $isOwner = $user->hasRole('owner') || (!$user->roles()->exists() && $user->created_by === null);
        if (!$isOwner) {
            return [
                null,
                null,
                'Password reset via email OTP is only available for business owner accounts. Please ask your business owner to reset your password.',
                403,
            ];
        }

        $tenant = Tenant::find($user->tenant_id);
        if (!$tenant) {
            return [null, null, 'Business account not found.', 404];
        }

        return [$user, $tenant, null, 200];
    }

    /**
     * Step 1: Send a 6-digit password reset OTP to the business owner's email.
     * POST /api/forgot-password/send-otp
     */
    public function sendForgotPasswordOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255',
        ]);

        $normalizedEmail = strtolower(trim($request->email));
        $rateKey = 'forgot-otp-send:' . $request->ip() . ':' . $normalizedEmail;

        if (RateLimiter::tooManyAttempts($rateKey, 5)) {
            $seconds = RateLimiter::availableIn($rateKey);
            return response()->json([
                'success' => false,
                'message' => "Too many OTP requests. Please try again in {$seconds} seconds.",
            ], 429);
        }

        [$user, $tenant, $errorMessage, $status] = $this->resolveOwnerByEmail($normalizedEmail);
        if (!$user || !$tenant) {
            RateLimiter::hit($rateKey, 60);
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
            ], $status);
        }

        // Remove any previous unused OTPs for THIS tenant's owner only (strict tenant isolation)
        PasswordResetOtp::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->delete();

        // Generate a 6-digit OTP that does not collide with any active OTP on another tenant
        $activeOtherOtps = PasswordResetOtp::where('tenant_id', '!=', $tenant->id)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->get();

        $genAttempts = 0;
        do {
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $collision = false;
            foreach ($activeOtherOtps as $other) {
                if ($other->matchesOtpForTenant((int) $other->tenant_id, (int) $other->user_id, $otp)) {
                    $collision = true;
                    break;
                }
            }
            $genAttempts++;
        } while ($collision && $genAttempts < 10);

        $otpRecord = PasswordResetOtp::create([
            'tenant_id'  => $tenant->id,
            'user_id'    => $user->id,
            'email'      => $normalizedEmail,
            'otp_hash'   => PasswordResetOtp::hashForTenant((int) $tenant->id, (int) $user->id, $otp),
            'attempts'   => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        RateLimiter::hit($rateKey, 60);

        try {
            SendPasswordResetOtpJob::dispatch(
                (int) $tenant->id,
                (int) $user->id,
                $normalizedEmail,
                $otp,
                (string) $user->name,
                (string) $tenant->name,
                10,
                (int) $otpRecord->id
            );
        } catch (\Exception $e) {
            Log::error('Failed to queue/send password reset OTP email: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Could not send the OTP email. Please check your mail configuration and try again.',
            ], 500);
        }

        return response()->json([
            'success'   => true,
            'queued'    => true,
            'message'   => 'A 6-digit OTP has been sent to your email address.',
            'tenant_id' => $tenant->id,
        ]);
    }

    /**
     * Step 2: Verify the 6-digit OTP for the owner's tenant before unlocking the new password form.
     * POST /api/forgot-password/verify-otp
     */
    public function verifyForgotPasswordOtp(Request $request)
    {
        $request->validate([
            'email'     => 'required|string|email|max:255',
            'otp'       => 'required|string|size:6',
            'tenant_id' => 'nullable|integer',
        ]);

        $normalizedEmail = strtolower(trim($request->email));
        $otpInput = trim($request->otp);

        [$user, $tenant, $errorMessage, $status] = $this->resolveOwnerByEmail($normalizedEmail);
        if (!$user || !$tenant) {
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
            ], $status);
        }

        // Enforce tenant data isolation if tenant_id is supplied
        if ($request->filled('tenant_id') && (int) $request->input('tenant_id') !== (int) $tenant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP code for this business account.',
            ], 403);
        }

        $otpRecord = PasswordResetOtp::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('email', $normalizedEmail)
            ->whereNull('used_at')
            ->latest('id')
            ->first();

        if (!$otpRecord || $otpRecord->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP code. Please request a new OTP.',
            ], 422);
        }

        if ($otpRecord->attempts >= 5) {
            return response()->json([
                'success' => false,
                'message' => 'Too many incorrect OTP attempts. Please request a new OTP.',
            ], 429);
        }

        if (!$otpRecord->matchesOtpForTenant((int) $tenant->id, (int) $user->id, $otpInput)) {
            $otpRecord->increment('attempts');
            return response()->json([
                'success' => false,
                'message' => 'The OTP entered is incorrect. Please check your email and try again.',
            ], 422);
        }

        $resetToken = Str::random(64);
        $otpRecord->update([
            'verified_at'      => now(),
            'reset_token_hash' => PasswordResetOtp::hashForTenant((int) $tenant->id, (int) $user->id, $resetToken),
        ]);

        return response()->json([
            'success'     => true,
            'message'     => 'OTP verified successfully. Please enter your new password.',
            'reset_token' => $resetToken,
            'tenant_id'   => $tenant->id,
        ]);
    }

    /**
     * Step 3: Reset the business owner's password after a verified tenant-isolated OTP.
     * POST /api/forgot-password/reset-password
     */
    public function resetForgotPassword(Request $request)
    {
        $request->validate([
            'email'       => 'required|string|email|max:255',
            'otp'         => 'required|string|size:6',
            'reset_token' => 'nullable|string',
            'tenant_id'   => 'nullable|integer',
            'password'    => 'required|string|min:8|confirmed',
        ]);

        $normalizedEmail = strtolower(trim($request->email));
        $otpInput = trim($request->otp);

        [$user, $tenant, $errorMessage, $status] = $this->resolveOwnerByEmail($normalizedEmail);
        if (!$user || !$tenant) {
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
            ], $status);
        }

        // Enforce tenant data isolation if tenant_id is supplied
        if ($request->filled('tenant_id') && (int) $request->input('tenant_id') !== (int) $tenant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP code for this business account.',
            ], 403);
        }

        $otpRecord = PasswordResetOtp::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('email', $normalizedEmail)
            ->whereNull('used_at')
            ->latest('id')
            ->first();

        if (!$otpRecord || $otpRecord->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP code. Please request a new OTP.',
            ], 422);
        }

        if ($otpRecord->attempts >= 5) {
            return response()->json([
                'success' => false,
                'message' => 'Too many incorrect OTP attempts. Please request a new OTP.',
            ], 429);
        }

        if (!$otpRecord->isVerified()) {
            return response()->json([
                'success' => false,
                'message' => 'You must verify your OTP before setting a new password.',
            ], 403);
        }

        if (!$otpRecord->matchesOtpForTenant((int) $tenant->id, (int) $user->id, $otpInput)) {
            $otpRecord->increment('attempts');
            return response()->json([
                'success' => false,
                'message' => 'The OTP entered is incorrect.',
            ], 422);
        }

        if ($request->filled('reset_token') && !$otpRecord->matchesResetTokenForTenant((int) $tenant->id, (int) $user->id, (string) $request->input('reset_token'))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid password reset token for this business account.',
            ], 403);
        }

        // Update password strictly scoped to both user_id and tenant_id
        User::withoutGlobalScopes()
            ->where('id', $user->id)
            ->where('tenant_id', $tenant->id)
            ->update([
                'password' => Hash::make($request->password),
            ]);

        $otpRecord->update([
            'used_at' => now(),
        ]);

        // Revoke any existing sessions/tokens for this user
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. You can now sign in with your new password.',
        ]);
    }
}
