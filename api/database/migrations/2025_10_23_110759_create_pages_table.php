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
        Schema::create('pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->enum('page_type', ['privacy_policy', 'terms_conditions', 'support'])->default('privacy_policy');
            $table->string('page_title');
            $table->longText('page_content');
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign key constraint
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->index('user_id', 'pages_user_id_index');
            $table->index('page_type', 'pages_page_type_index');
            $table->index('deleted_at', 'pages_deleted_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
