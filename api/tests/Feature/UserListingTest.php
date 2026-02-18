<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserListingTest extends TestCase
{
    use RefreshDatabase;
    
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Run the permission seeder to create permissions
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        
        // Create additional roles
        Role::create(['name' => 'user']);
        Role::create(['name' => 'manager']);
        
        // Create and authenticate a user with admin role
        $this->user = User::factory()->create();
        $this->user->assignRole('Admin'); // Use the seeded Admin role
        
        $this->actingAs($this->user, 'sanctum');
    }

    public function test_user_listing_with_pagination()
    {
        // Create test users
        $users = User::factory()->count(25)->create();
        
        // Assign roles to some users
        $users->take(5)->each->assignRole('Admin');
        $users->skip(5)->take(10)->each->assignRole('user');
        $users->skip(15)->take(5)->each->assignRole('manager');

        $response = $this->getJson('/api/v1/users?per_page=10');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'status',
                    'message',
                    'data' => [
                        'data' => [
                            '*' => [
                                'id',
                                'name',
                                'email',
                                'roles',
                                'role_names',
                                'primary_role'
                            ]
                        ],
                        'current_page',
                        'per_page',
                        'total',
                        'last_page'
                    ]
                ]);

        $responseData = $response->json();
        $users = $responseData['data']['data'];
        $this->assertLessThanOrEqual(10, count($users));
        $this->assertEquals(20, $responseData['data']['total']); // 25 test users - 5 admin users (authenticated user is also admin and excluded)
    }

    public function test_user_listing_with_search_filter()
    {
        // Create users with specific names
        User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        User::factory()->create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);
        User::factory()->create(['name' => 'Bob Johnson', 'email' => 'bob@example.com']);

        $response = $this->getJson('/api/v1/users?search=john');

        $response->assertStatus(200);
        $users = $response->json('data.data');
        
        $this->assertCount(2, $users); // John Doe and Bob Johnson
        $this->assertTrue(collect($users)->contains('name', 'John Doe'));
        $this->assertTrue(collect($users)->contains('name', 'Bob Johnson'));
    }

    public function test_user_listing_with_role_filter()
    {
        // Create users and assign roles
        $userUsers = User::factory()->count(3)->create();
        $managerUsers = User::factory()->count(5)->create();
        
        $userUsers->each->assignRole('user');
        $managerUsers->each->assignRole('manager');

        $response = $this->getJson('/api/v1/users?role=user');

        $response->assertStatus(200);
        $users = $response->json('data.data');
        
        $this->assertCount(3, $users); // 3 test users with 'user' role
        $this->assertTrue(collect($users)->every(fn($user) => in_array('user', $user['role_names'])));
    }

    public function test_user_listing_with_status_filter()
    {
        // Create users with different status values
        User::factory()->count(5)->create(['is_active' => 1]); // Active
        User::factory()->count(3)->create(['is_active' => 2]); // Pending
        User::factory()->count(2)->create(['is_active' => 0]); // Banned

        // Test active status filter
        $response = $this->getJson('/api/v1/users?status=active');
        $response->assertStatus(200);
        $users = $response->json('data.data');
        $this->assertCount(5, $users); // 5 active users
        $this->assertTrue(collect($users)->every(fn($user) => $user['is_active'] === 1));

        // Test pending status filter
        $response = $this->getJson('/api/v1/users?status=pending');
        $response->assertStatus(200);
        $users = $response->json('data.data');
        $this->assertCount(3, $users); // 3 pending users
        $this->assertTrue(collect($users)->every(fn($user) => $user['is_active'] === 2));

        // Test banned status filter
        $response = $this->getJson('/api/v1/users?status=banned');
        $response->assertStatus(200);
        $users = $response->json('data.data');
        $this->assertCount(2, $users); // 2 banned users
        $this->assertTrue(collect($users)->every(fn($user) => $user['is_active'] === 0));
    }

    public function test_user_listing_with_sorting()
    {
        // Create users with different names
        User::factory()->create(['name' => 'Charlie Brown']);
        User::factory()->create(['name' => 'Alice Smith']);
        User::factory()->create(['name' => 'Bob Wilson']);

        $response = $this->getJson('/api/v1/users?sort=name&order=asc');

        $response->assertStatus(200);
        $users = $response->json('data.data');
        
        $names = collect($users)->pluck('name')->toArray();
        // Should contain the test users in alphabetical order, plus the authenticated user
        $this->assertContains('Alice Smith', $names);
        $this->assertContains('Bob Wilson', $names);
        $this->assertContains('Charlie Brown', $names);
        $this->assertCount(3, $names); // 3 test users (authenticated user is admin and excluded)
    }

    public function test_user_listing_includes_role_information()
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(200);
        $userData = $response->json('data.data.0');
        
        $this->assertArrayHasKey('roles', $userData);
        $this->assertArrayHasKey('role_names', $userData);
        $this->assertArrayHasKey('primary_role', $userData);
        $this->assertEquals(['user'], $userData['role_names']);
        $this->assertEquals('user', $userData['primary_role']);
    }
}
