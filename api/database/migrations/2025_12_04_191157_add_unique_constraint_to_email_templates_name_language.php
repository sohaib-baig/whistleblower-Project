<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Remove any duplicate entries first
        DB::statement('
            DELETE t1 FROM email_templates t1
            INNER JOIN email_templates t2 
            WHERE t1.id > t2.id 
            AND t1.name = t2.name 
            AND t1.language = t2.language
        ');

        Schema::table('email_templates', function (Blueprint $table) {
            $table->unique(['name', 'language'], 'email_templates_name_language_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('email_templates', function (Blueprint $table) {
            $table->dropUnique('email_templates_name_language_unique');
        });
    }
};
