<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Integration\StoreIntegrationRequest;
use App\Http\Requests\Integration\UpdateIntegrationRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\TrackDriveClient;
use App\Services\LeadExecClient;
use App\Services\AuditLogger;

class IntegrationController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Integration::class);

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = $request->string('search')->toString();
        $status = $request->string('status', 'all')->toString();
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();

        $query = Integration::query();

        // Search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('endpoint', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status !== 'all') {
            switch ($status) {
                case 'connected':
                    $query->where('is_connected', true);
                    break;
                case 'disconnected':
                    $query->where('is_connected', false);
                    break;
                default:
                    // No additional filtering for unknown status
                    break;
            }
        }

        // Sorting
        $allowedSorts = ['name', 'endpoint', 'created_at', 'is_connected'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        }

        $integrations = $query->paginate($perPage);

        return $this->success($integrations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIntegrationRequest $request)
    {
        $this->authorize('create', Integration::class);
        
        $data = $request->validated();
        $integration = Integration::create($data);
        
        app(AuditLogger::class)->log($request, 'integration.created', 'Integration', $integration->id, [
            'name' => $integration->name,
            'endpoint' => $integration->endpoint,
        ]);
        
        return $this->success($integration, 'Integration created successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Integration $integration)
    {
        $this->authorize('view', $integration);
        
        // Never expose secrets in responses
        unset($integration['app_secret']);
        unset($integration['token']);
        return $this->success($integration);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIntegrationRequest $request, Integration $integration)
    {
        $this->authorize('update', $integration);
        
        $oldData = $integration->only(['name', 'endpoint', 'is_connected']);
        $data = $request->validated();
        $integration->update($data);
        
        // Log changes but exclude sensitive data
        $logData = [
            'name' => $integration->name,
            'endpoint' => $integration->endpoint,
        ];

        // Only log changes for non-sensitive fields
        $safeData = array_diff_key($data, array_flip(['app_secret', 'token']));
        $logData['changes'] = array_diff_assoc($safeData, $oldData);

        app(AuditLogger::class)->log($request, 'integration.updated', 'Integration', $integration->id, $logData);
        
        // Never expose secrets in responses
        unset($integration['app_secret']);
        unset($integration['token']);
        return $this->success($integration, 'Integration updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Integration $integration)
    {
        $this->authorize('delete', $integration);
        
        $integrationData = $integration->only(['name', 'endpoint']);
        $integration->delete();
        
        app(AuditLogger::class)->log($request, 'integration.deleted', 'Integration', $integration->id, $integrationData);
        
        return $this->success(null, 'Integration deleted successfully', 204);
    }

    /**
     * Get integration connection status.
     */
    public function status(Request $request, Integration $integration)
    {
        $this->authorize('view', $integration);
        
        app(AuditLogger::class)->log($request, 'integration.status_checked', 'Integration', $integration->id, [
            'name' => $integration->name,
            'is_connected' => $integration->is_connected,
        ]);
        
        return $this->success([
            'id' => $integration->id,
            'name' => $integration->name,
            'is_connected' => $integration->is_connected,
            'last_checked' => now()->toISOString(),
        ]);
    }

    /**
     * Connect the integration.
     */
    public function connect(Request $request, Integration $integration)
    {
        $this->authorize('update', $integration);

        // Validate that required credentials are present
        if (empty($integration->app_key) || empty($integration->app_secret)) {
            app(AuditLogger::class)->log($request, 'integration.connect_failed', 'Integration', $integration->id, [
                'name' => $integration->name,
                'error' => 'missing_credentials',
            ]);
            return $this->error('Integration credentials are missing or incomplete', 422);
        }

        // Select provider client by integration name (case-insensitive)
        $name = strtolower((string) $integration->name);
        $client = match (true) {
            str_contains($name, 'trackdrive') => TrackDriveClient::fromCredentials(
                $integration->endpoint,
                $integration->app_key,
                $integration->app_secret,
            ),
            str_contains($name, 'leadexec') => LeadExecClient::fromCredentials(
                $integration->endpoint,
                $integration->app_key,
                $integration->app_secret,
            ),
            default => null,
        };

        $isValid = false;
        $errorMessage = null;
        try {
            if ($client === null) {
                $errorMessage = 'Unsupported provider';
                app(AuditLogger::class)->log(request(), 'integration.connect_failed', 'Integration', $integration->id, [
                    'name' => $integration->name,
                    'provider' => $name,
                    'error' => 'unsupported_provider',
                ]);
                return $this->error($errorMessage, 422);
            }
            $isValid = $client->validateCredentials();
        } catch (\Throwable $e) {
            // Do not leak details; return a generic message
            $errorMessage = 'Failed to connect to provider';
            app(AuditLogger::class)->log(request(), 'integration.connect_failed', 'Integration', $integration->id, [
                'name' => $integration->name,
                'provider' => $name,
                'error' => 'provider_error',
            ]);
            return $this->error($errorMessage, 502);
        }

        if (! $isValid) {
            $errorMessage = 'Invalid credentials';
            app(AuditLogger::class)->log(request(), 'integration.connect_failed', 'Integration', $integration->id, [
                'name' => $integration->name,
                'provider' => $name,
                'error' => 'invalid_credentials',
            ]);
            return $this->error($errorMessage, 422);
        }

        // For LeadExec, store token and fetch leadtype data
        $updateData = ['is_connected' => true];
        if ($client instanceof LeadExecClient) {
            $updateData['token'] = $client->getToken();

            try {
                $leadTypes = $client->getLeadTypes();
                if (!empty($leadTypes)) {
                    // Get the first leadtype
                    $firstLeadType = $leadTypes[0];
                    $leadTypeUid = $firstLeadType['LeadTypeUID'] ?? null;
                    $leadTypeName = $firstLeadType['Descriptor'] ?? null;
                    
                    if ($leadTypeUid && $leadTypeName) {
                        $updateData['leadtype_uid'] = $leadTypeUid;
                        $updateData['leadtype_name'] = $leadTypeName;

                        // Get today's lead count
                        $userTimezone = $request->user()?->timezone ?: 'UTC';
                        $todayCount = $client->getTodayLeadCount($leadTypeUid, $userTimezone);
                        $updateData['today_count'] = $todayCount;
                    }
                }
            } catch (\Throwable $e) {
                // Log but don't fail the connection if leadtype fetch fails
                app(AuditLogger::class)->log(request(), 'integration.leadtype_fetch_failed', 'Integration', $integration->id, [
                    'name' => $integration->name,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $integration->update($updateData);
        
        app(AuditLogger::class)->log(request(), 'integration.connected', 'Integration', $integration->id, [
            'name' => $integration->name,
            'provider' => $name,
        ]);
        unset($integration['token']);
        return $this->success($integration, 'Integration connected successfully');
    }

    /**
     * Disconnect the integration.
     */
    public function disconnect(Request $request, Integration $integration)
    {
        $this->authorize('update', $integration);

        // Clear LeadExec-specific data on disconnect
        $updateData = ['is_connected' => false];
        if (str_contains(strtolower((string) $integration->name), 'leadexec')) {
            $updateData['token'] = null;
            $updateData['leadtype_uid'] = null;
            $updateData['leadtype_name'] = null;
            $updateData['today_count'] = 0;
        }

        $integration->update($updateData);
        
        app(AuditLogger::class)->log($request, 'integration.disconnected', 'Integration', $integration->id, [
            'name' => $integration->name,
        ]);
        
        return $this->success($integration, 'Integration disconnected successfully');
    }
}
