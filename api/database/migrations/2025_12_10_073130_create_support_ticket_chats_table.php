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
        Schema::create('support_ticket_chats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('support_ticket_id');
            $table->longText('content');
            $table->uuid('reply_from');
            $table->uuid('reply_to')->nullable();
            $table->string('attachment')->nullable();
            $table->enum('created_from', ['company', 'case_manager', 'admin'])->default('company');
            $table->timestamps();
            $table->softDeletes();

            // Foreign key constraints
            $table->foreign('support_ticket_id')->references('id')->on('support_tickets')->onDelete('cascade');
            $table->foreign('reply_from')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reply_to')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index('support_ticket_id', 'support_ticket_chats_support_ticket_id_index');
            $table->index('reply_from', 'support_ticket_chats_reply_from_index');
            $table->index('reply_to', 'support_ticket_chats_reply_to_index');
            $table->index('created_from', 'support_ticket_chats_created_from_index');
            $table->index('deleted_at', 'support_ticket_chats_deleted_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_ticket_chats');
    }
};
