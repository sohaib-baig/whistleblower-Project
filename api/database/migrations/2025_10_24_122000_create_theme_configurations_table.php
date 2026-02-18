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
        Schema::create('theme_configurations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->boolean('mode')->default(0)->comment('0=light, 1=dark');
            $table->boolean('contrast')->default(0)->comment('0=default, 1=high');
            $table->boolean('right_left')->default(0)->comment('0=ltr, 1=rtl');
            $table->boolean('compact')->default(1)->comment('0=false, 1=true (compact layout)');
            $table->string('color_setting')->default('default')->comment('default, cyan, purple, etc.');
            $table->tinyInteger('navigation_type')->default(1)->comment('1=vertical, 2=horizontal, 3=mini');
            $table->boolean('navigation_color')->default(0)->comment('0=integrate, 1=apparent');
            $table->enum('typography', ['Public Sans', 'Inter', 'DM Sans', 'Nunito Sans'])->default('Public Sans');
            $table->string('font_size')->default('16')->comment('14, 16, 18, etc.');
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('theme_configurations');
    }
};

