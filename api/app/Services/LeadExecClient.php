<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LeadExecClient
{
    private ?string $token = null;

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
        // LeadExec uses OAuth2 client_credentials at /v1/authorization/token
        $tokenEndpoint = rtrim($this->baseUrl, '/') . '/v1/authorization/token';

        Log::info('LeadExec: Validating credentials (client_credentials)', [
            'endpoint' => $tokenEndpoint,
            'client_id_prefix' => substr($this->appKey, 0, 8) . '...',
        ]);

        try {
            $response = Http::timeout(15)
                ->asJson()
                ->withHeaders([
                    'Accept' => 'application/json',
                ])
                ->post($tokenEndpoint, [
                    'client_id' => $this->appKey,
                    'client_secret' => $this->appSecret,
                    'grant_type' => 'client_credentials',
                ]);

            Log::info('LeadExec: Token endpoint response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
            ]);

            if ($response->successful()) {
                $json = $response->json();
                $hasToken = is_array($json) && isset($json['access_token']) && is_string($json['access_token']) && $json['access_token'] !== '';
                if ($hasToken) {
                    $this->token = $json['access_token'];
                    $tokenPreview = substr((string) $this->token, 0, 6) . '...';
                    Log::info('LeadExec: Credentials validated (token received)', [
                        'token_preview' => $tokenPreview,
                    ]);
                    return true;
                }
                Log::warning('LeadExec: Successful response without access_token');
                return false;
            }

            if (in_array($response->status(), [400, 401, 403], true)) {
                Log::warning('LeadExec: Invalid credentials', [
                    'status' => $response->status(),
                ]);
                return false;
            }

            Log::error('LeadExec: Unexpected error during validation', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;

        } catch (\Throwable $e) {
            Log::error('LeadExec: Exception during credential validation', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            return false;
        }
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function getLeadTypes(): array
    {
        if (!$this->token) {
            throw new \RuntimeException('Token not available. Call validateCredentials() first.');
        }

        $url = rtrim($this->baseUrl, '/') . '/v1/leadtypes';

        Log::info('LeadExec: Fetching leadtypes', [
            'url' => $url,
        ]);

        try {
            $response = Http::timeout(15)
                ->withToken($this->token)
                ->get($url);

            Log::info('LeadExec: Leadtypes response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return is_array($data) ? $data : [];
            }

            Log::error('LeadExec: Failed to fetch leadtypes', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];

        } catch (\Throwable $e) {
            Log::error('LeadExec: Exception during leadtypes fetch', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            return [];
        }
    }

    public function getTodayLeadCount(string $leadTypeUid, string $userTimezone): int
    {
        if (!$this->token) {
            throw new \RuntimeException('Token not available. Call validateCredentials() first.');
        }

        $url = "https://apidata.leadexec.net/v1/leads/query/{$leadTypeUid}";

        // Calculate today's start and end datetime in user's timezone
        $now = now($userTimezone);
        $startDate = $now->startOfDay()->utc()->toISOString();
        $endDate = $now->endOfDay()->utc()->toISOString();

        $body = [
            'StartDate' => $startDate,
            'EndDate' => $endDate,
            'Query' => (object) [],
            'Skip' => 0,
            'Take' => 50,
        ];

        Log::info('LeadExec: Fetching today lead count', [
            'url' => $url,
            'body' => $body
        ]);

        try {
            $response = Http::timeout(15)
                ->withToken($this->token)
                ->asJson()
                ->post($url, $body);

            Log::info('LeadExec: Lead count response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['SentCount'] ?? 0;
            }

            Log::error('LeadExec: Failed to fetch lead count', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return 0;

        } catch (\Throwable $e) {
            Log::error('LeadExec: Exception during lead count fetch', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            return 0;
        }
    }
}


