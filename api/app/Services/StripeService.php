<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\Checkout\Session;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Create a Stripe Checkout Session for subscription payment
     *
     * @param Order $order
     * @param string $successUrl
     * @param string $cancelUrl
     * @return Session
     */
    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): Session
    {
        try {
            // Calculate total price including VAT for subscription
            $totalPrice = (float) $order->price + (float) $order->vat;
            
            // Build line items for subscription (yearly recurring)
            $lineItems = [
                [
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => $order->title,
                            'description' => 'One year subscription to Wisling whistleblowing management platform',
                        ],
                        'unit_amount' => (int) ($totalPrice * 100), // Stripe uses cents
                        'recurring' => [
                            'interval' => 'year',
                        ],
                    ],
                    'quantity' => 1,
                ],
            ];

            // Calculate VAT percentage for metadata
            $vatPercentage = $order->price > 0 && $order->vat > 0
                ? round((($order->vat / (float) $order->price) * 100), 2)
                : 0;

            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => $lineItems,
                'mode' => 'subscription', // Changed from 'payment' to 'subscription'
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'metadata' => [
                    'order_id' => $order->id,
                    'user_id' => $order->company_id,
                    'invoice_number' => $order->invoice_number,
                    'vat_percentage' => $vatPercentage,
                ],
                'customer_email' => $order->company->email ?? null,
            ]);

            return $session;
        } catch (\Exception $e) {
            Log::error('Stripe checkout session creation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Handle Stripe webhook events
     *
     * @param string $payload
     * @param string $signature
     * @return array
     */
    public function handleWebhook(string $payload, string $signature): array
    {
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $signature, $webhookSecret);

            // Handle different event types
            switch ($event->type) {
                case 'checkout.session.completed':
                    $session = $event->data->object;
                    $this->handleSuccessfulPayment($session);
                    break;

                case 'customer.subscription.created':
                    $subscription = $event->data->object;
                    $this->handleSubscriptionCreated($subscription);
                    break;

                case 'customer.subscription.updated':
                    $subscription = $event->data->object;
                    $this->handleSubscriptionUpdated($subscription);
                    break;

                case 'customer.subscription.deleted':
                    $subscription = $event->data->object;
                    $this->handleSubscriptionDeleted($subscription);
                    break;

                case 'invoice.payment_succeeded':
                    $invoice = $event->data->object;
                    $this->handleInvoicePaymentSucceeded($invoice);
                    break;

                case 'invoice.payment_failed':
                    $invoice = $event->data->object;
                    $this->handleInvoicePaymentFailed($invoice);
                    break;

                case 'payment_intent.succeeded':
                    // Payment succeeded
                    break;

                case 'payment_intent.payment_failed':
                    $session = $event->data->object;
                    $this->handleFailedPayment($session);
                    break;

                default:
                    // Unhandled event type
                    Log::info('Unhandled Stripe event: ' . $event->type);
            }

            return ['status' => 'success', 'event' => $event->type];
        } catch (\Exception $e) {
            Log::error('Stripe webhook error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Handle successful payment
     *
     * @param object $session
     */
    private function handleSuccessfulPayment($session): void
    {
        $orderId = $session->metadata->order_id ?? null;

        if (!$orderId) {
            Log::error('Order ID not found in Stripe session metadata');
            return;
        }

        $order = Order::find($orderId);
        if (!$order) {
            Log::error('Order not found: ' . $orderId);
            return;
        }

        // Extract subscription and customer IDs if this is a subscription checkout
        $subscriptionId = $session->subscription ?? null;
        $customerId = $session->customer ?? null;

        // Update order status to 'paid' and store subscription/customer IDs
        $order->update([
            'status' => 'paid',
            'stripe_subscription_id' => $subscriptionId,
            'stripe_customer_id' => $customerId,
            'payment_response' => json_encode([
                'event_type' => 'checkout.session.completed',
                'session_id' => $session->id,
                'subscription_id' => $subscriptionId,
                'customer_id' => $customerId,
                'payment_status' => $session->payment_status,
                'payment_intent' => $session->payment_intent ?? null,
                'amount_total' => $session->amount_total,
                'amount_subtotal' => $session->amount_subtotal ?? null,
                'currency' => $session->currency,
                'customer_email' => $session->customer_email ?? null,
                'customer_details' => $session->customer_details ?? null,
                'created' => $session->created ?? null,
                'metadata' => $session->metadata ?? null,
                'processed_at' => now()->toDateTimeString(),
            ]),
        ]);

        Log::info('Payment successful for order: ' . $orderId, [
            'order_id' => $orderId,
            'session_id' => $session->id,
            'subscription_id' => $subscriptionId,
            'customer_id' => $customerId,
            'amount' => $session->amount_total,
        ]);

        // Notify admin about payment
        try {
            app(\App\Services\NotificationService::class)->notifyPaymentReceived($order);
        } catch (\Exception $e) {
            Log::warning('Failed to send payment notification', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle subscription created event
     *
     * @param object $subscription
     */
    private function handleSubscriptionCreated($subscription): void
    {
        // Find order by subscription ID
        $order = Order::where('stripe_subscription_id', $subscription->id)->first();
        
        if (!$order) {
            // Try to find by customer ID and metadata
            if (isset($subscription->metadata->order_id)) {
                $order = Order::find($subscription->metadata->order_id);
            }
        }

        if ($order) {
            $order->update([
                'stripe_subscription_id' => $subscription->id,
                'stripe_customer_id' => $subscription->customer ?? null,
            ]);

            Log::info('Subscription created for order: ' . $order->id, [
                'order_id' => $order->id,
                'subscription_id' => $subscription->id,
                'customer_id' => $subscription->customer,
                'status' => $subscription->status,
            ]);
        } else {
            Log::warning('Order not found for subscription: ' . $subscription->id);
        }
    }

    /**
     * Handle subscription updated event
     *
     * @param object $subscription
     */
    private function handleSubscriptionUpdated($subscription): void
    {
        $order = Order::where('stripe_subscription_id', $subscription->id)->first();

        if ($order) {
            Log::info('Subscription updated for order: ' . $order->id, [
                'order_id' => $order->id,
                'subscription_id' => $subscription->id,
                'status' => $subscription->status,
            ]);

            // Update order status based on subscription status
            if ($subscription->status === 'canceled' || $subscription->status === 'unpaid') {
                // Optionally update order status if subscription is canceled
                // $order->update(['status' => 'cancelled']);
            }
        }
    }

    /**
     * Handle subscription deleted event
     *
     * @param object $subscription
     */
    private function handleSubscriptionDeleted($subscription): void
    {
        $order = Order::where('stripe_subscription_id', $subscription->id)->first();

        if ($order) {
            Log::info('Subscription deleted for order: ' . $order->id, [
                'order_id' => $order->id,
                'subscription_id' => $subscription->id,
            ]);

            // Optionally update order status
            // $order->update(['status' => 'cancelled']);
        }
    }

    /**
     * Handle invoice payment succeeded (for recurring payments)
     *
     * @param object $invoice
     */
    private function handleInvoicePaymentSucceeded($invoice): void
    {
        $subscriptionId = $invoice->subscription ?? null;
        
        if ($subscriptionId) {
            $order = Order::where('stripe_subscription_id', $subscriptionId)->first();

            if ($order) {
                Log::info('Recurring payment succeeded for order: ' . $order->id, [
                    'order_id' => $order->id,
                    'subscription_id' => $subscriptionId,
                    'invoice_id' => $invoice->id,
                    'amount_paid' => $invoice->amount_paid,
                ]);
            }
        }
    }

    /**
     * Handle invoice payment failed (for recurring payments)
     *
     * @param object $invoice
     */
    private function handleInvoicePaymentFailed($invoice): void
    {
        $subscriptionId = $invoice->subscription ?? null;
        
        if ($subscriptionId) {
            $order = Order::where('stripe_subscription_id', $subscriptionId)->first();

            if ($order) {
                Log::warning('Recurring payment failed for order: ' . $order->id, [
                    'order_id' => $order->id,
                    'subscription_id' => $subscriptionId,
                    'invoice_id' => $invoice->id,
                    'attempt_count' => $invoice->attempt_count ?? null,
                ]);
            }
        }
    }

    /**
     * Handle failed payment
     *
     * @param object $session
     */
    private function handleFailedPayment($session): void
    {
        $orderId = $session->metadata->order_id ?? null;

        if (!$orderId) {
            return;
        }

        $order = Order::find($orderId);
        if (!$order) {
            return;
        }

        // Update order status to 'failed' and log the response
        $order->update([
            'status' => 'failed',
            'payment_response' => json_encode([
                'event_type' => 'payment_intent.payment_failed',
                'session_id' => $session->id ?? null,
                'payment_intent' => $session->id ?? null,
                'error' => 'Payment failed',
                'last_payment_error' => $session->last_payment_error ?? null,
                'failure_code' => $session->last_payment_error->code ?? null,
                'failure_message' => $session->last_payment_error->message ?? null,
                'processed_at' => now()->toDateTimeString(),
            ]),
        ]);

        Log::warning('Payment failed for order: ' . $orderId, [
            'order_id' => $orderId,
            'error' => $session->last_payment_error ?? 'Unknown error',
        ]);
    }
}

