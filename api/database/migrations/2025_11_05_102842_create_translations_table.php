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
        Schema::create('translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('translatable_type'); // e.g., 'App\Models\Page'
            $table->uuid('translatable_id');
            $table->string('translatable_field'); // e.g., 'page_title', 'page_content'
            $table->string('language', 10); // e.g., 'sv', 'en', 'no', 'da', 'fi', 'de', 'fr'
            $table->longText('translated_text');
            $table->string('source_text_hash', 64); // MD5 hash of source text for change detection
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for efficient lookups
            $table->index(['translatable_type', 'translatable_id', 'translatable_field', 'language'], 'translation_lookup_index');
            $table->index('source_text_hash', 'translation_hash_index');
            $table->index('language', 'translation_language_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
