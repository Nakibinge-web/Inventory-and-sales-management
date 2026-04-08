<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');
        $isApi = $request->wantsJson() || $request->isJson() || $request->expectsJson();

        if (Auth::attempt($credentials)) {
            if (!$isApi) {
                $request->session()->regenerate();
                return redirect()->intended('/');
            }

            $user = Auth::user();
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful.'
            ]);
        }

        if ($isApi) {
            return response()->json([
                'success' => false,
                'message' => 'The provided credentials do not match our records.'
            ], 401);
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }

    public function showRegisterForm()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Create a new tenant for the user
        $tenant = \App\Models\Tenant::create([
            'name' => $request->name . "'s Business",
            'email' => $request->email,
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);
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
