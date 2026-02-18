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
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('created_by')->nullable();
            $table->uuid('company_id');
            $table->string('invoice_number');
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled'])->default('pending');
            $table->date('invoice_date');
            $table->string('title');
            $table->decimal('price', 10, 2);
            $table->decimal('vat', 10, 2)->default(0);
            $table->enum('payment_type', ['stripe', 'bank_transfer'])->default('stripe');
            $table->json('payment_response')->nullable();
            $table->string('payment_attachment')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign key constraints
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('company_id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->index('created_by', 'orders_created_by_index');
            $table->index('company_id', 'orders_company_id_index');
            $table->index('status', 'orders_status_index');
            $table->index('deleted_at', 'orders_deleted_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
