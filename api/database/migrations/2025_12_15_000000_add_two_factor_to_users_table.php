<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('two_factor_enabled')
                ->default(false)
                ->after('is_active');

            $table->string('two_factor_method')
                ->nullable()
                ->after('two_factor_enabled')
                ->comment('email or app');

            $table->string('two_factor_secret')
                ->nullable()
                ->after('two_factor_method')
                ->comment('TOTP secret for authenticator apps');

            $table->string('two_factor_email_code')
                ->nullable()
                ->after('two_factor_secret')
                ->comment('Hashed email 2FA code');

            $table->timestamp('two_factor_email_expires_at')
                ->nullable()
                ->after('two_factor_email_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_enabled',
                'two_factor_method',
                'two_factor_secret',
                'two_factor_email_code',
                'two_factor_email_expires_at',
            ]);
        });
    }
};











