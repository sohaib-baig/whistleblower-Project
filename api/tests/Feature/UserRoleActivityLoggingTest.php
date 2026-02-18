<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ActivityLog;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserRoleActivityLoggingTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        
        // Create and authenticate a user with admin role
        $this->user = User::factory()->create();
        $this->user->assignRole('Admin');
        
        $this->actingAs($this->user, 'sanctum');
    }

    public function test_user_created_activity_logging()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'is_active' => 1,
            'role' => 'user',
        ];

        $response = $this->postJson('/api/v1/users', $userData);
        $response->assertStatus(201);

        $createdUser = User::where('email', 'test@example.com')->first();
        
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'user.created',
            'subject_type' => 'User',
            'subject_id' => $createdUser->id,
        ]);
    }

    public function test_user_updated_activity_logging()
    {
        $targetUser = User::factory()->create(['name' => 'Original Name']);
        
        $updateData = [
            'name' => 'Updated Name',
            'is_active' => 2,
        ];

        $response = $this->putJson("/api/v1/users/{$targetUser->id}", $updateData);
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'user.updated',
            'subject_type' => 'User',
            'subject_id' => $targetUser->id,
        ]);
    }

    public function test_user_deleted_activity_logging()
    {
        $targetUser = User::factory()->create(['name' => 'To Be Deleted']);

        $response = $this->deleteJson("/api/v1/users/{$targetUser->id}");
        $response->assertStatus(204);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'user.deleted',
            'subject_type' => 'User',
            'subject_id' => $targetUser->id,
        ]);
    }

    public function test_user_role_assigned_activity_logging()
    {
        $targetUser = User::factory()->create();
        Role::create(['name' => 'test_role']);

        $response = $this->postJson("/api/v1/users/{$targetUser->id}/assign-role", [
            'role' => 'test_role'
        ]);
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'user.role.assigned',
            'subject_type' => 'User',
            'subject_id' => $targetUser->id,
        ]);
    }

    public function test_user_role_removed_activity_logging()
    {
        $targetUser = User::factory()->create();
        $role = Role::create(['name' => 'test_role']);
        $targetUser->assignRole($role);

        $response = $this->deleteJson("/api/v1/users/{$targetUser->id}/remove-role", [
            'role' => 'test_role'
        ]);
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'user.role.removed',
            'subject_type' => 'User',
            'subject_id' => $targetUser->id,
        ]);
    }

    public function test_user_permission_assigned_activity_logging()
    {
        $targetUser = User::factory()->create();
        Permission::create(['name' => 'test.permission']);

        $response = $this->postJson("/api/v1/users/{$targetUser->id}/assign-permission", [
            'permission' => 'test.permission'
        ]);
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'user.permission.assigned',
            'subject_type' => 'User',
            'subject_id' => $targetUser->id,
        ]);
    }

    public function test_user_permission_removed_activity_logging()
    {
        $targetUser = User::factory()->create();
        $permission = Permission::create(['name' => 'test.permission']);
        $targetUser->givePermissionTo($permission);

        $response = $this->deleteJson("/api/v1/users/{$targetUser->id}/remove-permission", [
            'permission' => 'test.permission'
        ]);
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'user.permission.removed',
            'subject_type' => 'User',
            'subject_id' => $targetUser->id,
        ]);
    }

    public function test_user_welcome_resend_activity_logging()
    {
        $targetUser = User::factory()->create(['email_verified_at' => null]);

        $response = $this->postJson("/api/v1/users/{$targetUser->id}/resend-welcome");
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'user.welcome.resend',
            'subject_type' => 'User',
            'subject_id' => $targetUser->id,
        ]);
    }

    public function test_role_created_activity_logging()
    {
        $roleData = [
            'name' => 'test_role',
            'permissions' => ['users.view', 'users.create'],
        ];

        $response = $this->postJson('/api/v1/roles', $roleData);
        $response->assertStatus(201);

        $createdRole = Role::where('name', 'test_role')->first();
        
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'role.created',
            'subject_type' => 'Role',
            'subject_id' => $createdRole->id,
        ]);
    }

    public function test_role_updated_activity_logging()
    {
        $role = Role::create(['name' => 'test_role']);
        
        $updateData = [
            'name' => 'updated_role',
            'permissions' => ['users.view'],
        ];

        $response = $this->putJson("/api/v1/roles/{$role->id}", $updateData);
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'role.updated',
            'subject_type' => 'Role',
            'subject_id' => $role->id,
        ]);
    }

    public function test_role_permissions_updated_activity_logging()
    {
        $role = Role::create(['name' => 'test_role']);
        $permission1 = Permission::create(['name' => 'test.permission1']);
        $permission2 = Permission::create(['name' => 'test.permission2']);
        $role->givePermissionTo($permission1);

        $response = $this->putJson("/api/v1/roles/{$role->id}/permissions", [
            'permissions' => [$permission2->id]
        ]);
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'role.permissions.updated',
            'subject_type' => 'Role',
            'subject_id' => $role->id,
        ]);
    }

    public function test_role_deleted_activity_logging()
    {
        $role = Role::create(['name' => 'test_role']);
        $permission = Permission::create(['name' => 'test.permission']);
        $role->givePermissionTo($permission);

        $response = $this->deleteJson("/api/v1/roles/{$role->id}");
        $response->assertStatus(204);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'role.deleted',
            'subject_type' => 'Role',
            'subject_id' => $role->id,
        ]);
    }
}
