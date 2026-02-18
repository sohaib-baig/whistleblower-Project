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
        Schema::create('admin_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('logo')->nullable();
            $table->integer('open_state_deadline_days')->default(0);
            $table->integer('close_state_deadline_days')->default(0);
            $table->decimal('vat', 5, 2)->default(0);
            $table->decimal('price', 10, 2)->default(0);
            $table->time('phone_hours_from')->default('09:00:00');
            $table->time('phone_hours_to')->default('18:00:00');
            $table->text('invoice_note')->nullable();
            $table->boolean('delete_closed_cases')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_settings');
    }
};

