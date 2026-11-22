<?php

namespace App\Http\Controllers;

use App\Services\Ai\AiManager;
use App\Services\Ai\AiProviderException;
use App\Services\Ai\PromptInjectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiController extends Controller
{
    public function __construct(private AiManager $ai)
    {
    }

    /**
     * GET /api/ai/status
     * Return active AI provider, configured provider availability (booleans only), and failover settings.
     */
    public function status(): JsonResponse
    {
        $tenant = Auth::user()?->tenant;

        return response()->json([
            'success' => true,
            'data'    => $this->ai->getStatus($tenant),
        ]);
    }

    /**
     * PUT /api/ai/provider
     * Switch active provider between 'mistral', 'gemini', or 'auto' (.env default) for the tenant.
     * Restricted to Owner / Admin users.
     */
    public function updateProvider(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->hasRole('owner') && !$user->hasRole('admin'))) {
            return response()->json([
                'success' => false,
                'message' => 'Only business owners or administrators can switch AI providers.',
            ], 403);
        }

        $validated = $request->validate([
            'provider' => 'required|in:mistral,gemini,auto',
        ]);

        $tenant = $user->tenant;
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Business tenant not found.',
            ], 404);
        }

        $value = $validated['provider'] === 'auto' ? null : $validated['provider'];
        $tenant->update(['ai_provider' => $value]);
        $tenant->refresh();

        $status = $this->ai->getStatus($tenant);

        return response()->json([
            'success' => true,
            'message' => "AI Assistant switched to {$status['active_label']}.",
            'data'    => $status,
        ]);
    }

    /**
     * POST /api/ai/chat
     * Accepts { question: string } and returns an AI-generated answer
     * grounded in the tenant's actual business data using the active/fallback AI provider.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate(['question' => 'required|string|max:1000']);

        try {
            $result = $this->ai->chat(Auth::user(), $request->question);

            return response()->json([
                'success'          => true,
                'answer'           => $result['answer'],
                'provider'         => $result['provider'],
                'provider_label'   => $result['provider_label'],
                'model'            => $result['model'],
                'failover_used'    => $result['failover_used'],
                'primary_provider' => $result['primary_provider'],
            ]);
        } catch (PromptInjectionException $e) {
            return response()->json([
                'success'          => false,
                'security_blocked' => true,
                'rule'             => $e->rule,
                'message'          => $e->getMessage(),
            ], 422);
        } catch (AiProviderException $e) {
            $status = ($e->httpStatus >= 400 && $e->httpStatus < 600) ? $e->httpStatus : 502;
            $msg = $status === 429
                ? 'The AI service is temporarily rate-limited or quota-exhausted. Please switch providers or try again in a moment.'
                : $e->getMessage();

            return response()->json([
                'success'  => false,
                'provider' => $e->provider,
                'message'  => $msg,
            ], $status);
        }
    }
}
