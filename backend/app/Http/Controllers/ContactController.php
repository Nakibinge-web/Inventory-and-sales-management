<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    /**
     * Handle a public contact inquiry form submission.
     */
    public function submit(Request $request)
    {
        // Rate limit: maximum 5 contact submissions per 10 minutes per IP
        $key = 'contact-submission:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Too many inquiries sent. Please try again in {$seconds} seconds.",
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'name'          => 'required|string|min:2|max:120',
            'email'         => 'required|email|max:150',
            'business_name' => 'nullable|string|max:150',
            'subject'       => 'required|string|min:3|max:150',
            'message'       => 'required|string|min:10|max:4000',
        ], [
            'name.required'    => 'Please enter your name.',
            'email.required'   => 'Please enter a valid email address.',
            'email.email'      => 'Please enter a valid email address.',
            'subject.required' => 'Please select or enter a subject.',
            'message.required' => 'Please write your message.',
            'message.min'      => 'Your message should be at least 10 characters long.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Increment rate limiter hit
        RateLimiter::hit($key, 600);

        // Safely log the inquiry for administrators/support
        Log::channel('single')->info('Public Contact Form Submission', [
            'name'          => $data['name'],
            'email'         => $data['email'],
            'business_name' => $data['business_name'] ?? null,
            'subject'       => $data['subject'],
            'message_length'=> strlen($data['message']),
            'ip'            => $request->ip(),
            'timestamp'     => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for reaching out! We have received your inquiry and our team will get back to you shortly.',
        ], 200);
    }
}
