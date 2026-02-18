<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Requests\Profile\ChangePasswordRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Services\AuditLogger;

class ProfileController extends Controller
{
    use ApiResponse;

    public function show(Request $request)
    {
        $user = $request->user();

        return $this->success([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'phone' => $user->phone,
            'company' => $user->company,
            'avatar_path' => $user->avatar_path,
            'avatar_url' => $user->avatar_path ? Storage::disk('public')->url($user->avatar_path) : null,
            'country' => $user->country,
            'address' => $user->address,
            'state' => $user->state,
            'city' => $user->city,
            'zip_code' => $user->zip_code,
            'timezone' => $user->timezone,
            'about' => $user->about,
            'user_language' => $user->user_language,
        ]);
    }

    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();
        
        // Debug logging
        Log::info('Profile update request', [
            'user_id' => $user->id,
            'request_data' => $request->all(),
            'validated_data' => $data,
        ]);
        
        foreach (['name','phone','company','country','address','state','city','zip_code','about','timezone','user_language'] as $field) {
            if (array_key_exists($field, $data)) {
                $user->{$field} = $data[$field];
                Log::info("Updating field: {$field}", ['value' => $data[$field]]);
            }
        }
        
        $user->save();
        
        Log::info('Profile updated', [
            'user_id' => $user->id,
            'user_language' => $user->user_language,
        ]);
        
        app(AuditLogger::class)->log($request, 'profile.update');
        return $this->success([
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'phone' => $user->phone,
            'company' => $user->company,
            'avatar_path' => $user->avatar_path,
            'avatar_url' => $user->avatar_path ? Storage::disk('public')->url($user->avatar_path) : null,
            'country' => $user->country,
            'address' => $user->address,
            'state' => $user->state,
            'city' => $user->city,
            'zip_code' => $user->zip_code,
            'timezone' => $user->timezone,
            'about' => $user->about,
            'user_language' => $user->user_language,
        ], 'Profile updated');
    }

    public function uploadAvatar(Request $request)
    {
		$request->validate([
			'avatar' => ['required','file','mimes:jpg,jpeg,png','max:3072'],
		]);

        $user = $request->user();
        $file = $request->file('avatar');

        $path = $file->store('avatars', 'public');
        $user->avatar_path = $path;
        $user->save();

        app(AuditLogger::class)->log($request, 'profile.avatar.update');
        return $this->success([
            'avatar_path' => $user->avatar_path,
            'avatar_url' => Storage::disk('public')->url($user->avatar_path),
        ], 'Avatar updated');
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();
        $hasInitialPassword = !empty($user->initial_password);
        
        // If user has initial_password set, old_password is optional
        // If provided, verify it matches initial_password (stored as plain text)
        // Otherwise, old_password is validated by ChangePasswordRequest using 'current_password' rule
        if ($hasInitialPassword) {
            $oldPassword = $request->string('old_password', '');
            // If old_password is provided, verify it matches initial_password
            if (!empty($oldPassword)) {
                if ($oldPassword !== $user->initial_password) {
                    return $this->error('The provided password does not match your initial password.', 422);
                }
            }
            // Clear initial_password when setting new password
            $user->initial_password = null;
        }
        
        // Update the password field in the users table
        $user->password = \Illuminate\Support\Facades\Hash::make($request->string('new_password'));
        $user->save();
        
        $action = $hasInitialPassword ? 'profile.password.set' : 'profile.password.change';
        app(AuditLogger::class)->log($request, $action);
        
        $message = $hasInitialPassword ? 'Password set successfully' : 'Password changed successfully';
        return $this->success(null, $message);
    }
}


