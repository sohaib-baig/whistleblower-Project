<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ManualEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class FinancialReportTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $admin;
    protected User $mediaBuyer1;
    protected User $mediaBuyer2;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        Permission::create(['name' => 'manual_entries.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'manual_entries.create', 'guard_name' => 'web']);

        // Create admin role
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        
        // Create admin user
        $this->admin = User::factory()->create([
            'email' => 'admin@test.com',
            'is_active' => 1,
        ]);
        $this->admin->assignRole($adminRole);

        // Create media buyers
        $this->mediaBuyer1 = User::factory()->create([
            'name' => 'Media Buyer One',
            'email' => 'buyer1@test.com',
            'is_active' => 1,
        ]);

        $this->mediaBuyer2 = User::factory()->create([
            'name' => 'Media Buyer Two',
            'email' => 'buyer2@test.com',
            'is_active' => 1,
        ]);
    }

    /** @test */
    public function it_can_generate_financial_report_for_current_month()
    {
        // Create manual entries for current month
        ManualEntry::create([
            'media_buyer_id' => $this->mediaBuyer1->id,
            'report_date' => now()->startOfMonth()->format('Y-m-d'),
            'campaign_breakdown' => [
                ['name' => 'Campaign 1', 'spend' => 100, 'revenue' => 150],
                ['name' => 'Campaign 2', 'spend' => 50, 'revenue' => 80],
            ],
        ]);

        ManualEntry::create([
            'media_buyer_id' => $this->mediaBuyer2->id,
            'report_date' => now()->startOfMonth()->addDay()->format('Y-m-d'),
            'campaign_breakdown' => [
                ['name' => 'Campaign 3', 'spend' => 200, 'revenue' => 300],
            ],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/manual_entries/reports/financial');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'accounts' => [
                        '*' => [
                            'account',
                            'campaigns' => [
                                '*' => [
                                    'campaign',
                                    'monthly' => ['type'],
                                    'daily' => [
                                        '*' => ['date'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'totals' => [
                        'account',
                        'campaigns' => [
                            '*' => [
                                'campaign',
                                'monthly' => ['type'],
                                'daily' => [
                                    '*' => ['date'],
                                ],
                            ],
                        ],
                    ],
                ],
            ]);

        $data = $response->json('data');
        
        // Verify totals
        $this->assertArrayHasKey('totals', $data);
        $this->assertEquals('Totals', $data['totals']['account']);
        
        // Verify accounts
        $this->assertCount(2, $data['accounts']);
        $this->assertEquals('Media Buyer One', $data['accounts'][0]['account']);
        $this->assertEquals('Media Buyer Two', $data['accounts'][1]['account']);

        // Verify campaigns structure (Cost, Revenue, ROI, Net)
        $this->assertCount(4, $data['accounts'][0]['campaigns']);
        $this->assertEquals('Cost', $data['accounts'][0]['campaigns'][0]['campaign']);
        $this->assertEquals('Revenue', $data['accounts'][0]['campaigns'][1]['campaign']);
        $this->assertEquals('ROI', $data['accounts'][0]['campaigns'][2]['campaign']);
        $this->assertEquals('Net', $data['accounts'][0]['campaigns'][3]['campaign']);
    }

    /** @test */
    public function it_can_filter_financial_report_by_specific_month()
    {
        // Create manual entries for October 2024
        ManualEntry::create([
            'media_buyer_id' => $this->mediaBuyer1->id,
            'report_date' => '2024-10-01',
            'campaign_breakdown' => [
                ['name' => 'Campaign 1', 'spend' => 100, 'revenue' => 150],
            ],
        ]);

        // Create entry for November (should not be included)
        ManualEntry::create([
            'media_buyer_id' => $this->mediaBuyer1->id,
            'report_date' => '2024-11-01',
            'campaign_breakdown' => [
                ['name' => 'Campaign 2', 'spend' => 200, 'revenue' => 300],
            ],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/manual_entries/reports/financial?month=2024-10');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        
        // Verify only October data is included
        $costCampaign = collect($data['totals']['campaigns'])->firstWhere('campaign', 'Cost');
        $this->assertEquals(100, $costCampaign['monthly']['cost']);
    }

    /** @test */
    public function it_can_filter_financial_report_by_accounts()
    {
        ManualEntry::create([
            'media_buyer_id' => $this->mediaBuyer1->id,
            'report_date' => now()->format('Y-m-d'),
            'campaign_breakdown' => [
                ['name' => 'Campaign 1', 'spend' => 100, 'revenue' => 150],
            ],
        ]);

        ManualEntry::create([
            'media_buyer_id' => $this->mediaBuyer2->id,
            'report_date' => now()->format('Y-m-d'),
            'campaign_breakdown' => [
                ['name' => 'Campaign 2', 'spend' => 200, 'revenue' => 300],
            ],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/manual_entries/reports/financial?accounts[]=' . urlencode('Media Buyer One'));

        $response->assertStatus(200);
        
        $data = $response->json('data');
        
        // Verify only Media Buyer One is included
        $this->assertCount(1, $data['accounts']);
        $this->assertEquals('Media Buyer One', $data['accounts'][0]['account']);
    }

    /** @test */
    public function it_calculates_roi_correctly()
    {
        ManualEntry::create([
            'media_buyer_id' => $this->mediaBuyer1->id,
            'report_date' => now()->format('Y-m-d'),
            'campaign_breakdown' => [
                ['name' => 'Campaign 1', 'spend' => 100, 'revenue' => 120], // 20% ROI
            ],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/manual_entries/reports/financial');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        
        $roiCampaign = collect($data['totals']['campaigns'])->firstWhere('campaign', 'ROI');
        $this->assertEquals(20, $roiCampaign['monthly']['roi']);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->getJson('/api/v1/manual_entries/reports/financial');

        $response->assertStatus(401);
    }

    /** @test */
    public function it_requires_permission_to_view_financial_report()
    {
        $user = User::factory()->create(['is_active' => 1]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/manual_entries/reports/financial');

        $response->assertStatus(403);
    }

    /** @test */
    public function it_returns_daily_data_for_all_days_in_month()
    {
        ManualEntry::create([
            'media_buyer_id' => $this->mediaBuyer1->id,
            'report_date' => '2024-10-15',
            'campaign_breakdown' => [
                ['name' => 'Campaign 1', 'spend' => 100, 'revenue' => 150],
            ],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/manual_entries/reports/financial?month=2024-10');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        
        // October has 31 days
        $costCampaign = collect($data['totals']['campaigns'])->firstWhere('campaign', 'Cost');
        $this->assertCount(31, $costCampaign['daily']);
        
        // Verify date format
        $this->assertEquals('1-Oct', $costCampaign['daily'][0]['date']);
        $this->assertEquals('31-Oct', $costCampaign['daily'][30]['date']);
    }

    /** @test */
    public function it_handles_empty_data_gracefully()
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/manual_entries/reports/financial');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        
        $this->assertArrayHasKey('accounts', $data);
        $this->assertArrayHasKey('totals', $data);
        $this->assertEmpty($data['accounts']);
    }
}

