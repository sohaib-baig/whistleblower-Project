<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('stripe_subscription_id')->nullable()->after('payment_attachment');
            $table->string('stripe_customer_id')->nullable()->after('stripe_subscription_id');
            $table->index('stripe_subscription_id', 'orders_stripe_subscription_id_index');
            $table->index('stripe_customer_id', 'orders_stripe_customer_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_stripe_subscription_id_index');
            $table->dropIndex('orders_stripe_customer_id_index');
            $table->dropColumn(['stripe_subscription_id', 'stripe_customer_id']);
        });
    }
};
