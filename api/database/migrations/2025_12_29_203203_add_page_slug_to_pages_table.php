<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Models\Page;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->string('page_slug')->nullable()->after('page_title');
            $table->index('page_slug', 'pages_page_slug_index');
        });

        // Generate slugs for existing pages based on page_title
        Page::withTrashed()->chunk(100, function ($pages) {
            foreach ($pages as $page) {
                if (empty($page->page_slug) && !empty($page->page_title)) {
                    $baseSlug = Str::slug($page->page_title);
                    $slug = $baseSlug;
                    $counter = 1;
                    
                    // Ensure uniqueness per user_id and page_type combination
                    while (Page::where('user_id', $page->user_id)
                        ->where('page_type', $page->page_type)
                        ->where('page_slug', $slug)
                        ->where('id', '!=', $page->id)
                        ->exists()) {
                        $slug = $baseSlug . '-' . $counter;
                        $counter++;
                    }
                    
                    $page->page_slug = $slug;
                    $page->saveQuietly(); // Use saveQuietly to avoid triggering events
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropIndex('pages_page_slug_index');
            $table->dropColumn('page_slug');
        });
    }
};
