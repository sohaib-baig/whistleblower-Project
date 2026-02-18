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
        Schema::table('admin_settings', function (Blueprint $table) {
            $table->string('stripe_client_id')->nullable()->after('logo');
            $table->string('stripe_secret_key')->nullable()->after('stripe_client_id');
            $table->string('stripe_webhook_secret')->nullable()->after('stripe_secret_key');
            $table->string('iban')->nullable()->after('stripe_webhook_secret');
            $table->string('bic_code')->nullable()->after('iban');
            $table->string('bank_account')->nullable()->after('bic_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admin_settings', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_client_id',
                'stripe_secret_key',
                'stripe_webhook_secret',
                'iban',
                'bic_code',
                'bank_account',
            ]);
        });
    }
};




