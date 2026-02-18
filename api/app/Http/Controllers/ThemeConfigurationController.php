<?php

namespace App\Http\Controllers;

use App\Models\ThemeConfiguration;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\ThemeConfiguration\UpdateThemeConfigurationRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;

class ThemeConfigurationController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * Get the authenticated user's theme configuration
     */
    public function show(Request $request): JsonResponse
    {
        $config = ThemeConfiguration::where('user_id', $request->user()->id)->first();

        if (!$config) {
            // Return default configuration if none exists
            $config = new ThemeConfiguration();
            $config->user_id = $request->user()->id;
            // Default values are set in model
        }

        return $this->success($config);
    }

    /**
     * Update the authenticated user's theme configuration
     */
    public function update(UpdateThemeConfigurationRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        $config = ThemeConfiguration::where('user_id', $request->user()->id)->first();

        if (!$config) {
            // Create new configuration if it doesn't exist
            $config = new ThemeConfiguration();
            $config->user_id = $request->user()->id;
        }

        $oldData = $config->only(array_keys($data));

        foreach ($data as $key => $value) {
            $config->{$key} = $value;
        }

        $config->save();

        app(AuditLogger::class)->log($request, 'theme_configuration.updated', 'ThemeConfiguration', $config->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($config, 'Theme configuration updated successfully');
    }

    /**
     * Get default theme configuration for new users
     */
    public static function getDefaultConfiguration(): array
    {
        return [
            'mode' => 0, // light
            'contrast' => 0, // default
            'right_left' => 0, // ltr
            'compact' => 1, // true (compact layout enabled)
            'color_setting' => 'default',
            'navigation_type' => 1, // vertical
            'navigation_color' => 0, // integrate
            'typography' => 'Public Sans',
            'font_size' => '16',
        ];
    }

    /**
     * Create default theme configuration for a user
     */
    public static function createDefaultForUser(string $userId): ThemeConfiguration
    {
        $config = ThemeConfiguration::where('user_id', $userId)->first();

        if (!$config) {
            $config = new ThemeConfiguration();
            $config->user_id = $userId;
            $config->fill(self::getDefaultConfiguration());
            $config->save();
        }

        return $config;
    }
}

