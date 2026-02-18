<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\StripeService;
use App\Http\Controllers\Concerns\ApiResponse;
use Illuminate\Support\Facades\Log;

class StripeWebhookController extends Controller
{
    use ApiResponse;

    /**
     * Handle Stripe webhook events
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        if (!$signature) {
            return $this->error('Missing Stripe signature', 400);
        }

        try {
            $stripeService = new StripeService();
            $result = $stripeService->handleWebhook($payload, $signature);

            return $this->success($result, 'Webhook processed successfully');
        } catch (\Exception $e) {
            Log::error('Webhook handling failed: ' . $e->getMessage());
            return $this->error('Webhook processing failed', 400);
        }
    }
}

