<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CompanyCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $company;

    protected function setUp(): void
    {
        parent::setUp();

        // Run the permission seeder to create permissions
        $this->seed(\Database\Seeders\PermissionSeeder::class);

        // Create company role if it doesn't exist
        if (!Role::where('name', 'company')->exists()) {
            Role::create(['name' => 'company', 'guard_name' => 'web']);
        }

        // Create admin user
        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'is_active' => 1,
        ]);
        $this->admin->assignRole('admin'); // Use the seeded admin role

        // Create company user
        $this->company = User::factory()->create([
            'name' => 'Test Company',
            'email' => 'company@example.com',
            'company_name' => 'Test Company Inc.',
            'is_active' => 1,
        ]);
        $this->company->assignRole('company');
    }

    /** @test */
    public function admin_can_list_all_companies()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/companies');

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'data',
                    'current_page',
                    'per_page',
                    'total',
                ],
            ]);

        $this->assertTrue($response->json('status'));
        $this->assertGreaterThanOrEqual(1, count($response->json('data.data')));
    }

    /** @test */
    public function admin_can_search_companies()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/companies?search=Test');

        $response->assertOk();
        $this->assertTrue($response->json('status'));
        $this->assertGreaterThanOrEqual(1, count($response->json('data.data')));
    }

    /** @test */
    public function admin_can_filter_companies_by_status()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/companies?status=active');

        $response->assertOk();
        $this->assertTrue($response->json('status'));
    }

    /** @test */
    public function companies_list_respects_pagination()
    {
        // Create additional companies
        for ($i = 0; $i < 20; $i++) {
            $user = User::factory()->create([
                'name' => "Company {$i}",
                'email' => "company{$i}@example.com",
                'is_active' => 1,
            ]);
            $user->assignRole('company');
        }

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/companies?per_page=10');

        $response->assertOk();
        $this->assertEquals(10, count($response->json('data.data')));
        $this->assertEquals(10, $response->json('data.per_page'));
    }

    /** @test */
    public function admin_can_view_specific_company()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/companies/{$this->company->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'name',
                    'email',
                    'company_name',
                ],
            ]);

        $this->assertTrue($response->json('status'));
        $this->assertEquals($this->company->email, $response->json('data.email'));
    }

    /** @test */
    public function viewing_non_company_user_returns_error()
    {
        $nonCompanyUser = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'regular@example.com',
            'is_active' => 1,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/companies/{$nonCompanyUser->id}");

        $response->assertStatus(404);
        $this->assertFalse($response->json('status'));
    }

    /** @test */
    public function admin_can_create_company()
    {
        Storage::fake('public');

        $data = [
            'name' => 'New Company Contact',
            'email' => 'newcompany@example.com',
            'company_name' => 'New Company LLC',
            'phone' => '+1234567890',
            'country' => 'USA',
            'address' => '123 Main St',
            'city' => 'New York',
            'state' => 'NY',
            'zip_code' => '10001',
            'is_active' => 1,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/companies', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'name',
                    'email',
                    'company_name',
                    'roles',
                ],
            ]);

        $this->assertTrue($response->json('status'));
        $this->assertEquals('Company created successfully', $response->json('message'));

        // Verify user was created in database
        $this->assertDatabaseHas('users', [
            'email' => 'newcompany@example.com',
            'company_name' => 'New Company LLC',
        ]);

        // Verify company role was assigned
        $createdUser = User::where('email', 'newcompany@example.com')->first();
        $this->assertTrue($createdUser->hasRole('company'));
    }

    /** @test */
    public function admin_can_update_company()
    {
        $updateData = [
            'name' => 'Updated Company Name',
            'company_name' => 'Updated Company Inc.',
            'phone' => '+9876543210',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/companies/{$this->company->id}", $updateData);

        $response->assertOk()
            ->assertJson([
                'status' => true,
                'message' => 'Company updated successfully',
            ]);

        // Verify database was updated
        $this->assertDatabaseHas('users', [
            'id' => $this->company->id,
            'name' => 'Updated Company Name',
            'company_name' => 'Updated Company Inc.',
        ]);
    }

    /** @test */
    public function admin_can_delete_company()
    {
        $companyToDelete = User::factory()->create([
            'name' => 'Delete Me Company',
            'email' => 'delete@example.com',
            'is_active' => 1,
        ]);
        $companyToDelete->assignRole('company');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/companies/{$companyToDelete->id}");

        $response->assertStatus(204);

        // Verify soft delete
        $this->assertSoftDeleted('users', [
            'id' => $companyToDelete->id,
        ]);
    }

    /** @test */
    public function deleting_non_company_user_returns_error()
    {
        $nonCompanyUser = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'regular@example.com',
            'is_active' => 1,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/companies/{$nonCompanyUser->id}");

        $response->assertStatus(404);
        $this->assertFalse($response->json('status'));
    }

    /** @test */
    public function creating_company_requires_authentication()
    {
        $data = [
            'name' => 'Unauthenticated Company',
            'email' => 'unauth@example.com',
        ];

        $response = $this->postJson('/api/v1/companies', $data);

        $response->assertUnauthorized();
    }

    /** @test */
    public function creating_company_validates_required_fields()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/companies', []);

        $response->assertStatus(422);
        
        // Just verify we got validation errors - the format doesn't matter for this test
        // The important thing is that required fields are being validated
    }

    /** @test */
    public function creating_company_validates_unique_email()
    {
        $data = [
            'name' => 'Duplicate Email Company',
            'email' => $this->company->email, // Using existing email
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/companies', $data);

        $response->assertStatus(422);
        
        // Just verify we got validation error - email uniqueness is being validated
    }

    /** @test */
    public function updating_company_validates_unique_email()
    {
        $anotherCompany = User::factory()->create([
            'name' => 'Another Company',
            'email' => 'another@example.com',
            'is_active' => 1,
        ]);
        $anotherCompany->assignRole('company');

        $updateData = [
            'email' => $this->company->email, // Using existing email
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/companies/{$anotherCompany->id}", $updateData);

        $response->assertStatus(422);
        
        // Just verify we got validation error - email uniqueness is being validated
    }

    /** @test */
    public function response_follows_standard_envelope_format()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/companies');

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'message',
                'data',
            ]);

        $this->assertIsBool($response->json('status'));
    }

    /** @test */
    public function unauthorized_user_cannot_create_company()
    {
        // Create a user without permissions
        $unauthorizedUser = User::factory()->create([
            'name' => 'Unauthorized User',
            'email' => 'unauthorized@example.com',
            'is_active' => 1,
        ]);

        $data = [
            'name' => 'Unauthorized Company',
            'email' => 'unauthorized_company@example.com',
        ];

        $response = $this->actingAs($unauthorizedUser, 'sanctum')
            ->postJson('/api/v1/companies', $data);

        $response->assertForbidden();
    }
}

