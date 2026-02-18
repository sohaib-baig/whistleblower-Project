<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Integration;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Foundation\Testing\RefreshDatabase;

class IntegrationLeadExecConnectTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        // Ensure admin role exists and assign to user
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        $this->actingAs($this->user, 'sanctum');
    }

    public function test_leadexec_connect_success()
    {
        $integration = Integration::create([
            'name' => 'LeadExec',
            'endpoint' => 'https://api.leadexec.net',
            'app_key' => 'LE_TEST_KEY',
            'app_secret' => 'LE_TEST_SECRET',
            'is_connected' => false,
        ]);

        Http::fake([
            'https://api.leadexec.net/v1/authorization/token' => Http::response(['access_token' => 'abc123token'], 200),
        ]);

        $this->withSession(['_token' => 'test-csrf-token']);

        $response = $this->postJson(
            "/api/v1/integrations/{$integration->id}/connect",
            [],
            ['X-CSRF-TOKEN' => 'test-csrf-token']
        );

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
                'message' => 'Integration connected successfully',
            ]);

        $integration->refresh();
        $this->assertTrue($integration->is_connected);

        // Verify activity log was created
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'integration.connected',
            'subject_type' => 'Integration',
            'subject_id' => $integration->id,
        ]);
    }

    public function test_leadexec_connect_invalid_credentials()
    {
        $integration = Integration::create([
            'name' => 'LeadExec',
            'endpoint' => 'https://api.leadexec.net',
            'app_key' => 'LE_BAD_KEY',
            'app_secret' => 'LE_BAD_SECRET',
            'is_connected' => false,
        ]);

        Http::fake([
            'https://api.leadexec.net/v1/authorization/token' => Http::response(['error' => 'invalid_client'], 401),
        ]);

        $this->withSession(['_token' => 'test-csrf-token']);

        $response = $this->postJson(
            "/api/v1/integrations/{$integration->id}/connect",
            [],
            ['X-CSRF-TOKEN' => 'test-csrf-token']
        );

        $response->assertStatus(422)
            ->assertJson([
                'status' => false,
                'message' => 'Invalid credentials',
            ]);

        $integration->refresh();
        $this->assertFalse($integration->is_connected);

        // Verify failed connection activity log was created
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'integration.connect_failed',
            'subject_type' => 'Integration',
            'subject_id' => $integration->id,
        ]);
    }

    public function test_integration_activity_logging_crud_operations()
    {
        // Test create
        $integrationData = [
            'name' => 'Test Integration',
            'endpoint' => 'https://api.example.com',
            'app_key' => 'test_key',
            'app_secret' => 'test_secret',
            'is_connected' => false,
        ];

        $response = $this->postJson('/api/v1/integrations', $integrationData);
        $response->assertStatus(201);
        
        $integration = Integration::where('name', 'Test Integration')->first();
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'integration.created',
            'subject_type' => 'Integration',
            'subject_id' => $integration->id,
        ]);

        // Test update (name is immutable, update endpoint instead)
        $updateData = ['endpoint' => 'https://api.updated-example.com'];
        $response = $this->putJson("/api/v1/integrations/{$integration->id}", $updateData);
        $response->assertStatus(200);
        
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'integration.updated',
            'subject_type' => 'Integration',
            'subject_id' => $integration->id,
        ]);

        // Test disconnect
        $response = $this->postJson("/api/v1/integrations/{$integration->id}/disconnect");
        $response->assertStatus(200);
        
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'integration.disconnected',
            'subject_type' => 'Integration',
            'subject_id' => $integration->id,
        ]);

        // Test delete
        $response = $this->deleteJson("/api/v1/integrations/{$integration->id}");
        $response->assertStatus(204);
        
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'integration.deleted',
            'subject_type' => 'Integration',
            'subject_id' => $integration->id,
        ]);
    }

    public function test_integration_status_check_logging()
    {
        $integration = Integration::create([
            'name' => 'Test Integration',
            'endpoint' => 'https://api.example.com',
            'app_key' => 'test_key',
            'app_secret' => 'test_secret',
            'is_connected' => true,
        ]);

        $response = $this->getJson("/api/v1/integrations/{$integration->id}/status");
        $response->assertStatus(200);

        // Verify status check activity log was created
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'integration.status_checked',
            'subject_type' => 'Integration',
            'subject_id' => $integration->id,
        ]);
    }

    public function test_integration_connect_failed_logging()
    {
        $integration = Integration::create([
            'name' => 'UnsupportedProvider',
            'endpoint' => 'https://api.unsupported.com',
            'app_key' => 'test_key',
            'app_secret' => 'test_secret',
            'is_connected' => false,
        ]);

        $response = $this->postJson("/api/v1/integrations/{$integration->id}/connect");
        $response->assertStatus(422);

        // Verify unsupported provider failure was logged
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'integration.connect_failed',
            'subject_type' => 'Integration',
            'subject_id' => $integration->id,
        ]);
    }
}


