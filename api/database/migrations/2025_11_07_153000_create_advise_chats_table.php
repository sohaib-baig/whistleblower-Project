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
        Schema::create('advise_chats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('case_id');
            $table->uuid('created_by')->nullable();
            $table->enum('type', ['text', 'image', 'audio'])->default('text');
            $table->longText('message');
            $table->boolean('read_status')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('case_id')->references('id')->on('cases')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');

            $table->index('case_id', 'advise_chats_case_id_index');
            $table->index('created_by', 'advise_chats_created_by_index');
            $table->index('read_status', 'advise_chats_read_status_index');
            $table->index('deleted_at', 'advise_chats_deleted_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advise_chats');
    }
};


