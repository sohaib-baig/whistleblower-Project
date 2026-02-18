<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\ManualEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed essential roles and permissions
        $this->seed([
            \Database\Seeders\PermissionSeeder::class,
        ]);
    }

    public function test_dashboard_analytics_requires_authentication()
    {
        $response = $this->getJson('/api/v1/dashboard/analytics?start_date=2025-01-01&end_date=2025-01-31');

        $response->assertStatus(401);
    }

    public function test_dashboard_analytics_requires_dashboard_permissions()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard/analytics?start_date=2025-01-01&end_date=2025-01-31');

        $response->assertStatus(403)
            ->assertJson([
                'status' => false,
                'message' => 'Insufficient permissions - dashboard access required',
            ]);
    }

    public function test_dashboard_analytics_requires_start_date()
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard/analytics?end_date=2025-01-31');

        $response->assertStatus(422)
            ->assertJson([
                'status' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonStructure([
                'data' => [
                    'errors' => [
                        'start_date'
                    ]
                ]
            ]);
    }

    public function test_dashboard_analytics_requires_end_date()
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard/analytics?start_date=2025-01-01');

        $response->assertStatus(422)
            ->assertJson([
                'status' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonStructure([
                'data' => [
                    'errors' => [
                        'end_date'
                    ]
                ]
            ]);
    }

    public function test_dashboard_analytics_works_for_admin_users()
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        // Create a media buyer user
        $mediaBuyer = User::factory()->create();
        $mediaBuyer->assignRole('media_buyer');

        // Create some test data
        User::factory()->count(5)->create(['created_at' => now()->subDays(15)]);
        ManualEntry::factory()->count(3)->create([
            'media_buyer_id' => $mediaBuyer->id,
            'report_date' => now()->subDays(10),
            'total_spend' => 1000,
            'total_revenue' => 1500,
            'total_profit' => 500,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard/analytics?start_date=2025-01-01&end_date=2025-12-31');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'total_users',
                    'spend',
                    'revenue',
                    'profit',
                    'date_range' => [
                        'start_date',
                        'end_date',
                        'timezone',
                    ],
                ],
            ]);
    }

    public function test_dashboard_analytics_works_for_users_with_analytics_permissions()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('analytics.spend');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard/analytics?start_date=2025-01-01&end_date=2025-01-31');

        $response->assertStatus(200);
    }

    public function test_dashboard_analytics_works_for_users_with_analytics_spend_permissions()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('analytics.spend');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard/analytics?start_date=2025-01-01&end_date=2025-01-31');

        $response->assertStatus(200);
    }

    public function test_dashboard_analytics_filters_data_by_date_range()
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        // Create a media buyer user
        $mediaBuyer = User::factory()->create();
        $mediaBuyer->assignRole('media_buyer');

        // Create users in different date ranges
        User::factory()->create(['created_at' => now()->subDays(50)]); // Outside range
        User::factory()->create(['created_at' => now()->subDays(15)]); // Inside range
        User::factory()->create(['created_at' => now()->subDays(5)]);  // Inside range

        // Create manual entries in different date ranges
        ManualEntry::factory()->create([
            'media_buyer_id' => $mediaBuyer->id,
            'report_date' => now()->subDays(50),
            'total_spend' => 1000,
            'total_revenue' => 1500,
            'total_profit' => 500,
        ]); // Outside range

        ManualEntry::factory()->create([
            'media_buyer_id' => $mediaBuyer->id,
            'report_date' => now()->subDays(15),
            'total_spend' => 2000,
            'total_revenue' => 3000,
            'total_profit' => 1000,
        ]); // Inside range

        $startDate = now()->subDays(30)->format('Y-m-d');
        $endDate = now()->format('Y-m-d');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/dashboard/analytics?start_date={$startDate}&end_date={$endDate}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'total_users',
                    'spend',
                    'revenue',
                    'profit',
                    'date_range' => [
                        'start_date',
                        'end_date',
                        'timezone',
                    ],
                ],
            ]);
    }
}
