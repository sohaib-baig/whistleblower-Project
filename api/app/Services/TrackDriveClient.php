<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

class TrackDriveClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $appKey,
        private readonly string $appSecret,
    ) {}

    public static function fromCredentials(string $baseUrl, string $appKey, string $appSecret): self
    {
        return new self(rtrim($baseUrl, '/'), $appKey, $appSecret);
    }

    public function validateCredentials(): bool
    {
        $endpoint = $this->baseUrl . '/api/v1/me';

        Log::info('TrackDrive: Validating credentials', [
            'endpoint' => $endpoint,
            'app_key' => substr($this->appKey, 0, 8) . '...', // Log partial key for security
        ]);

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'Accept' => 'application/json',
                ])
                ->withBasicAuth($this->appKey, $this->appSecret)
                ->get($endpoint);

            Log::info('TrackDrive: API response received', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body' => $response->body(),
            ]);

            if ($response->successful()) {
                Log::info('TrackDrive: Credentials validated successfully');
                return true;
            }

            // Accept 401/403 as invalid credentials
            if (in_array($response->status(), [401, 403], true)) {
                Log::warning('TrackDrive: Invalid credentials', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }

            // Other errors treated as invalid for now
            Log::error('TrackDrive: Unexpected error during validation', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;

        } catch (\Exception $e) {
            Log::error('TrackDrive: Exception during credential validation', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'endpoint' => $endpoint,
            ]);
            return false;
        }
    }
}


