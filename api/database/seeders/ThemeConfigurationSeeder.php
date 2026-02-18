<?php

namespace Database\Seeders;

use App\Models\ThemeConfiguration;
use App\Models\User;
use Illuminate\Database\Seeder;

class ThemeConfigurationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Based on the default theme configuration from the frontend:
     * - mode: 0 = light (default), 1 = dark
     * - contrast: 0 = default, 1 = high
     * - right_left: 0 = ltr (left-to-right), 1 = rtl (right-to-left)
     * - compact: 0 = false, 1 = true (compact layout)
     * - color_setting: 'default', 'cyan', 'purple', etc.
     * - navigation_type: 1 = vertical, 2 = horizontal, 3 = mini
     * - navigation_color: 0 = integrate, 1 = apparent
     * - typography: 'Public Sans', 'Inter', 'DM Sans', 'Nunito Sans'
     * - font_size: '14', '16', '18', etc.
     */
    public function run(): void
    {
        // Get all users or create sample configurations
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        // Sample theme configurations for different use cases
        $themeConfigs = [
            // Default Light Theme Configuration (most common)
            [
                'mode' => 0, // light
                'contrast' => 0, // default
                'right_left' => 0, // ltr
                'compact' => 1, // true (compact layout enabled)
                'color_setting' => 'default',
                'navigation_type' => 1, // vertical
                'navigation_color' => 0, // integrate
                'typography' => 'Public Sans',
                'font_size' => '16',
            ],
            // Dark Theme Configuration
            [
                'mode' => 1, // dark
                'contrast' => 0, // default
                'right_left' => 0, // ltr
                'compact' => 1, // true
                'color_setting' => 'cyan',
                'navigation_type' => 1, // vertical
                'navigation_color' => 1, // apparent
                'typography' => 'Inter',
                'font_size' => '16',
            ],
            // High Contrast Configuration (Accessibility)
            [
                'mode' => 0, // light
                'contrast' => 1, // high
                'right_left' => 0, // ltr
                'compact' => 0, // false (normal layout)
                'color_setting' => 'default',
                'navigation_type' => 1, // vertical
                'navigation_color' => 1, // apparent
                'typography' => 'Public Sans',
                'font_size' => '18',
            ],
            // Horizontal Navigation Configuration
            [
                'mode' => 0, // light
                'contrast' => 0, // default
                'right_left' => 0, // ltr
                'compact' => 0, // false
                'color_setting' => 'purple',
                'navigation_type' => 2, // horizontal
                'navigation_color' => 0, // integrate
                'typography' => 'DM Sans',
                'font_size' => '16',
            ],
            // Mini Navigation Configuration
            [
                'mode' => 1, // dark
                'contrast' => 0, // default
                'right_left' => 0, // ltr
                'compact' => 1, // true
                'color_setting' => 'default',
                'navigation_type' => 3, // mini
                'navigation_color' => 0, // integrate
                'typography' => 'Nunito Sans',
                'font_size' => '14',
            ],
            // RTL (Right-to-Left) Configuration
            [
                'mode' => 0, // light
                'contrast' => 0, // default
                'right_left' => 1, // rtl
                'compact' => 0, // false
                'color_setting' => 'default',
                'navigation_type' => 1, // vertical
                'navigation_color' => 0, // integrate
                'typography' => 'Public Sans',
                'font_size' => '16',
            ],
        ];

        // Create theme configurations for users
        foreach ($users->take(count($themeConfigs)) as $index => $user) {
            ThemeConfiguration::firstOrCreate(
                ['user_id' => $user->id],
                $themeConfigs[$index]
            );
        }

        $this->command->info('Theme configurations seeded successfully!');
    }
}




