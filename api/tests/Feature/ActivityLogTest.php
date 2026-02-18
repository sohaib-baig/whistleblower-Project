<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\ActivityLog;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Ensure default config
        config(['app.timezone' => 'UTC']);
    }

    public function test_my_activity_logs_requires_auth(): void
    {
        $response = $this->get('/api/v1/activity-logs/my');
        $response->assertStatus(302); // sanctum redirect under web middleware
    }

    public function test_user_can_list_own_activity_logs_with_envelope(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        ActivityLog::factory()->create(['user_id' => $user->id, 'action' => 'auth.login']);
        ActivityLog::factory()->create(['user_id' => $user->id, 'action' => 'profile.update']);

        $response = $this->getJson('/api/v1/activity-logs/my');
        $response->assertOk();
        $response->assertJsonStructure([
            'status', 'message', 'data' => ['data' => [
                ['id','user_id','action','created_at']
            ]]
        ]);
        $this->assertTrue($response->json('status'));
    }

    public function test_admin_can_list_all_activity_logs_and_filter(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $other = User::factory()->create();

        ActivityLog::factory()->create(['user_id' => $admin->id, 'action' => 'auth.login']);
        ActivityLog::factory()->create(['user_id' => $other->id, 'action' => 'profile.update']);

        $this->actingAs($admin);
        $response = $this->getJson('/api/v1/activity-logs?user_id=' . $admin->id);
        $response->assertOk();
        $data = $response->json('data.data');
        $this->assertNotEmpty($data);
        $this->assertEquals($admin->id, $data[0]['user_id']);
    }
}


