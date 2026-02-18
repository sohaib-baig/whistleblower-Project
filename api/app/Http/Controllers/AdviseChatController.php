<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdviseChat\StoreAdviseChatAudioRequest;
use App\Http\Requests\AdviseChat\StoreAdviseChatImageRequest;
use App\Http\Requests\AdviseChat\StoreAdviseChatMessageRequest;
use App\Models\AdviseChat;
use App\Models\CaseModel;
use App\Models\User;
use App\Services\ChatEmailService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AdviseChatController extends Controller
{
    /**
     * Get advise chat messages for a case.
     */
    public function index(Request $request, string $caseId): JsonResponse
    {
        try {
            [$case] = $this->ensureUserCanAccessCase($request, $caseId);

            $language = $this->getLanguageFromRequest($request);
            $perPage = min((int) $request->query('per_page', 50), 100);
            $page = (int) $request->query('page', 1);

            $chats = AdviseChat::where('case_id', $case->id)
                ->with(['creator:id,name,email,role'])
                ->orderBy('created_at', 'asc')
                ->paginate($perPage, ['*'], 'page', $page);

            $translationsMap = [];
            if ($language !== 'en') {
                $textChatIds = $chats->where('type', 'text')->pluck('id')->toArray();
                if (!empty($textChatIds)) {
                    $existingTranslations = \App\Models\Translation::where('translatable_type', AdviseChat::class)
                        ->whereIn('translatable_id', $textChatIds)
                        ->where('language', $language)
                        ->where('translatable_field', 'message')
                        ->get()
                        ->keyBy('translatable_id');

                    foreach ($existingTranslations as $translation) {
                        $translationsMap[$translation->translatable_id] = $translation->translated_text;
                    }
                }
            }

            $translationService = $language !== 'en' ? app(\App\Services\TranslationService::class) : null;

            $chatsData = $chats->map(function (AdviseChat $chat) use ($language, $translationService, $translationsMap) {
                $message = $chat->message;

                if (in_array($chat->type, ['audio', 'image'], true) && !str_starts_with($chat->message, 'http')) {
                    $message = Storage::url($chat->message);
                } elseif ($chat->type === 'text' && $language !== 'en') {
                    if (isset($translationsMap[$chat->id])) {
                        $message = $translationsMap[$chat->id];
                    } elseif ($translationService) {
                        try {
                            $translatedMessage = $chat->getTranslated('message', $language);
                            $message = $translatedMessage ?? $chat->message;
                        } catch (\Exception $exception) {
                            Log::warning('Translation failed for advise chat.', [
                                'chat_id' => $chat->id,
                                'error' => $exception->getMessage(),
                            ]);
                        }
                    }
                }

                return [
                    'id' => $chat->id,
                    'message' => $message,
                    'type' => $chat->type,
                    'sender' => $chat->creator ? $chat->creator->name : 'System',
                    'timestamp' => $chat->created_at?->format('Y-m-d H:i:s'),
                    'read_status' => $chat->read_status,
                    'created_by' => $chat->created_by,
                    'creator' => $chat->creator ? [
                        'id' => $chat->creator->id,
                        'name' => $chat->creator->name,
                        'email' => $chat->creator->email,
                        'role' => $chat->creator->role,
                    ] : null,
                ];
            });

            return response()->json([
                'status' => true,
                'message' => 'Advise chat messages retrieved successfully.',
                'data' => $chatsData,
                'pagination' => [
                    'current_page' => $chats->currentPage(),
                    'per_page' => $chats->perPage(),
                    'total' => $chats->total(),
                    'last_page' => $chats->lastPage(),
                ],
            ]);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Case not found.',
            ], 404);
        } catch (HttpException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage() ?: 'Access denied.',
            ], $exception->getStatusCode());
        } catch (\Exception $exception) {
            Log::error('Failed to retrieve advise chat messages.', [
                'case_id' => $caseId,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve advise chat messages.',
            ], 500);
        }
    }

    /**
     * Store a text advise chat message.
     */
    public function storeMessage(StoreAdviseChatMessageRequest $request): JsonResponse
    {
        try {
            [$case, $user] = $this->ensureUserCanAccessCase($request, $request->input('case_id'));

            $chat = AdviseChat::create([
                'id' => (string) Str::uuid(),
                'case_id' => $case->id,
                'created_by' => $user->id,
                'type' => 'text',
                'message' => $request->validated()['message'],
                'read_status' => false,
            ]);

            $chat->load('creator:id,name,email,role');

            $this->dispatchAdviseChatNotifications($case, $user, $chat);

            return response()->json([
                'status' => true,
                'message' => 'Message sent successfully.',
                'data' => [
                    'id' => $chat->id,
                    'message' => $chat->message,
                    'type' => $chat->type,
                    'timestamp' => $chat->created_at?->format('Y-m-d H:i:s'),
                    'read_status' => $chat->read_status,
                    'created_by' => $chat->created_by,
                    'sender' => $chat->creator?->name,
                ],
            ], 201);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Case not found.',
            ], 404);
        } catch (HttpException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage() ?: 'Access denied.',
            ], $exception->getStatusCode());
        } catch (\Exception $exception) {
            Log::error('Failed to store advise chat message.', [
                'case_id' => $request->input('case_id'),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to send message.',
            ], 500);
        }
    }

    /**
     * Store an audio advise chat message.
     */
    public function storeAudio(StoreAdviseChatAudioRequest $request): JsonResponse
    {
        try {
            [$case, $user] = $this->ensureUserCanAccessCase($request, $request->input('case_id'));

            $audioFile = $request->file('audio');
            if (!$audioFile) {
                return response()->json([
                    'status' => false,
                    'message' => 'Audio file is required.',
                ], 400);
            }

            $mimeType = $audioFile->getMimeType();
            $extension = strtolower($audioFile->getClientOriginalExtension());

            if (empty($extension) || !in_array($extension, ['wav', 'mp3', 'mpeg', 'webm', 'ogg', 'opus'], true)) {
                if (str_contains($mimeType, 'webm')) {
                    $extension = 'webm';
                } elseif (str_contains($mimeType, 'ogg') || str_contains($mimeType, 'opus')) {
                    $extension = 'ogg';
                } elseif (str_contains($mimeType, 'wav') || str_contains($mimeType, 'wave')) {
                    $extension = 'wav';
                } elseif (str_contains($mimeType, 'mpeg') || str_contains($mimeType, 'mp3')) {
                    $extension = 'mp3';
                } else {
                    $extension = 'webm';
                }
            }

            $filename = time() . '_' . Str::random(10) . '.' . $extension;
            $path = $audioFile->storeAs('legal-support/audio', $filename, 'public');

            $chat = AdviseChat::create([
                'id' => (string) Str::uuid(),
                'case_id' => $case->id,
                'created_by' => $user->id,
                'type' => 'audio',
                'message' => $path,
                'read_status' => false,
            ]);

            $chat->load('creator:id,name,email,role');

            $this->dispatchAdviseChatNotifications($case, $user, $chat);

            return response()->json([
                'status' => true,
                'message' => 'Audio message sent successfully.',
                'data' => [
                    'id' => $chat->id,
                    'message' => Storage::url($chat->message),
                    'type' => $chat->type,
                    'timestamp' => $chat->created_at?->format('Y-m-d H:i:s'),
                    'read_status' => $chat->read_status,
                    'created_by' => $chat->created_by,
                    'sender' => $chat->creator?->name,
                ],
            ], 201);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Case not found.',
            ], 404);
        } catch (HttpException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage() ?: 'Access denied.',
            ], $exception->getStatusCode());
        } catch (\Exception $exception) {
            Log::error('Failed to store advise chat audio message.', [
                'case_id' => $request->input('case_id'),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to send audio message.',
            ], 500);
        }
    }

    /**
     * Store an image advise chat message.
     */
    public function storeImage(StoreAdviseChatImageRequest $request): JsonResponse
    {
        try {
            [$case, $user] = $this->ensureUserCanAccessCase($request, $request->input('case_id'));

            $imageFile = $request->file('image');
            if (!$imageFile) {
                return response()->json([
                    'status' => false,
                    'message' => 'Image file is required.',
                ], 400);
            }

            $extension = strtolower($imageFile->getClientOriginalExtension());
            $filename = time() . '_' . Str::random(10) . '.' . $extension;
            $path = $imageFile->storeAs('legal-support/images', $filename, 'public');

            $chat = AdviseChat::create([
                'id' => (string) Str::uuid(),
                'case_id' => $case->id,
                'created_by' => $user->id,
                'type' => 'image',
                'message' => $path,
                'read_status' => false,
            ]);

            $chat->load('creator:id,name,email,role');

            $this->dispatchAdviseChatNotifications($case, $user, $chat);

            return response()->json([
                'status' => true,
                'message' => 'Image message sent successfully.',
                'data' => [
                    'id' => $chat->id,
                    'message' => Storage::url($chat->message),
                    'type' => $chat->type,
                    'timestamp' => $chat->created_at?->format('Y-m-d H:i:s'),
                    'read_status' => $chat->read_status,
                    'created_by' => $chat->created_by,
                    'sender' => $chat->creator?->name,
                ],
            ], 201);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Case not found.',
            ], 404);
        } catch (HttpException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage() ?: 'Access denied.',
            ], $exception->getStatusCode());
        } catch (\Exception $exception) {
            Log::error('Failed to store advise chat image message.', [
                'case_id' => $request->input('case_id'),
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to send image message.',
            ], 500);
        }
    }

    /**
     * Get unread advise chat count for the authenticated user.
     */
    public function getUnreadCount(Request $request, string $caseId): JsonResponse
    {
        try {
            [$case, $user] = $this->ensureUserCanAccessCase($request, $caseId);

            $unreadCount = AdviseChat::where('case_id', $case->id)
                ->where('read_status', false)
                ->where(function ($query) use ($user) {
                    $query->whereNull('created_by')
                        ->orWhere('created_by', '!=', $user->id);
                })
                ->count();

            return response()->json([
                'status' => true,
                'message' => 'Unread advise chat count retrieved successfully.',
                'data' => [
                    'unread_count' => $unreadCount,
                ],
            ]);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Case not found.',
            ], 404);
        } catch (HttpException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage() ?: 'Access denied.',
            ], $exception->getStatusCode());
        } catch (\Exception $exception) {
            Log::error('Failed to retrieve unread advise chat count.', [
                'case_id' => $caseId,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve unread advise chat count.',
            ], 500);
        }
    }

    /**
     * Mark advise chat messages as read for the authenticated user.
     */
    public function markAsRead(Request $request, string $caseId): JsonResponse
    {
        try {
            [$case, $user] = $this->ensureUserCanAccessCase($request, $caseId);

            $updatedCount = AdviseChat::where('case_id', $case->id)
                ->where('read_status', false)
                ->where(function ($query) use ($user) {
                    $query->whereNull('created_by')
                        ->orWhere('created_by', '!=', $user->id);
                })
                ->update(['read_status' => true]);

            return response()->json([
                'status' => true,
                'message' => 'Advise chat messages marked as read successfully.',
                'data' => [
                    'marked_count' => $updatedCount,
                ],
            ]);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Case not found.',
            ], 404);
        } catch (HttpException $exception) {
            return response()->json([
                'status' => false,
                'message' => $exception->getMessage() ?: 'Access denied.',
            ], $exception->getStatusCode());
        } catch (\Exception $exception) {
            Log::error('Failed to mark advise chat messages as read.', [
                'case_id' => $caseId,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to mark advise chat messages as read.',
            ], 500);
        }
    }

    /**
     * Ensure the authenticated user can access advise chats for the given case.
     *
     * @return array{0: CaseModel, 1: \App\Models\User}
     */
    private function ensureUserCanAccessCase(Request $request, string $caseId): array
    {
        $user = $request->user();

        if (!$user) {
            throw new HttpException(401, 'Authentication required.');
        }

        $roleColumn = $user->role;
        $isAdmin = $user->hasRole('admin') || $roleColumn === 'admin';
        $isCaseManager = $user->hasRole('case_manager') || $roleColumn === 'case_manager';
        $isCompany = $user->hasRole('company') || $roleColumn === 'company';

        if (!$isAdmin && !$isCaseManager && !$isCompany) {
            throw new HttpException(403, 'You do not have permission to access advise chats.');
        }

        $case = CaseModel::findOrFail($caseId);

        if ($isCaseManager && $case->case_manager_id !== $user->id) {
            throw new HttpException(403, 'You can only access advise chats for cases assigned to you.');
        }

        if ($isCompany && $case->company_id !== $user->id) {
            throw new HttpException(403, 'You can only access advise chats for cases that belong to your company.');
        }

        return [$case, $user];
    }

    /**
     * Dispatch advise chat notifications to relevant recipients.
     */
    private function dispatchAdviseChatNotifications(CaseModel $case, User $sender, AdviseChat $chat): void
    {
        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $messagePreview = $this->formatAdviseChatMessagePreview($chat);

            $roleColumn = $sender->role;
            $isAdmin = $sender->hasRole('admin') || $roleColumn === 'admin';
            $isCaseManager = $sender->hasRole('case_manager') || $roleColumn === 'case_manager';
            $isCompany = $sender->hasRole('company') || $roleColumn === 'company';

            if ($isCaseManager || $isCompany) {
                $notificationService->notifyAdminsAdviseChatMessage(
                    $case,
                    $sender,
                    $messagePreview,
                    $chat->id,
                    $chat->type
                );
            }

            if ($isAdmin) {
                $notificationService->notifyCaseManagerAdviseChatMessage(
                    $case,
                    $sender,
                    $messagePreview,
                    $chat->id,
                    $chat->type
                );

                $notificationService->notifyCompanyAdviseChatMessage(
                    $case,
                    $sender,
                    $messagePreview,
                    $chat->id,
                    $chat->type
                );
            } elseif ($isCaseManager) {
                $notificationService->notifyCompanyAdviseChatMessage(
                    $case,
                    $sender,
                    $messagePreview,
                    $chat->id,
                    $chat->type
                );
            } elseif ($isCompany) {
                $notificationService->notifyCaseManagerAdviseChatMessage(
                    $case,
                    $sender,
                    $messagePreview,
                    $chat->id,
                    $chat->type
                );
            }

            $this->sendLegalSupportChatEmails($case, $sender, $chat);
        } catch (\Exception $exception) {
            Log::warning('Failed to dispatch advise chat notifications.', [
                'case_id' => $case->id,
                'chat_id' => $chat->id,
                'sender_id' => $sender->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Format advise chat message preview for notifications.
     */
    private function formatAdviseChatMessagePreview(AdviseChat $chat): string
    {
        return match ($chat->type) {
            'text' => Str::limit($chat->message, 120),
            'audio' => 'Audio message',
            'image' => 'Image message',
            default => 'Chat message',
        };
    }

    private function sendLegalSupportChatEmails(CaseModel $case, User $sender, AdviseChat $chat): void
    {
        $chatEmailService = app(ChatEmailService::class);

        $case->loadMissing('caseManager', 'company');

        $chatLink = $this->buildDashboardChatLink($case->id, 'legal-support');
        $messageContent = $this->resolveLegalSupportMessageContent($chat);
        $senderName = trim((string) $sender->name) !== '' ? $sender->name : 'User';
        $senderId = $sender->id;
        $senderEmail = $sender->email ?? null;

        $roleColumn = $sender->role;
        $isAdmin = $sender->hasRole('admin') || $roleColumn === 'admin';
        $isCaseManager = $sender->hasRole('case_manager') || $roleColumn === 'case_manager';
        $isCompany = $sender->hasRole('company') || $roleColumn === 'company';

        $recipients = [];

        if ($isAdmin) {
            if ($case->case_manager_id && $case->caseManager?->email) {
                $recipients[] = [
                    'name' => $case->caseManager->name ?? 'Case Manager',
                    'email' => $case->caseManager->email,
                ];
            }

            if ($case->company && $case->company->email) {
                $recipients[] = [
                    'name' => $case->company->name ?? 'Company User',
                    'email' => $case->company->email,
                ];
            }
        } elseif ($isCaseManager || $isCompany) {
            $adminRecipients = User::role('admin')
                ->whereNotNull('email')
                ->get();

            foreach ($adminRecipients as $admin) {
                $recipients[] = [
                    'name' => $admin->name ?? 'Admin',
                    'email' => $admin->email,
                    'id' => $admin->id,
                ];
            }
        }

        $sentEmails = [];

        foreach ($recipients as $recipient) {
            $email = strtolower(trim((string) ($recipient['email'] ?? '')));

            if ($email === '' || $email === strtolower((string) $senderEmail) || isset($sentEmails[$email])) {
                continue;
            }

            $sentEmails[$email] = true;

            $recipientName = $recipient['name'] ?? 'User';

            $chatEmailService->send($senderName, $recipientName, $recipient['email'], $chatLink, $messageContent);
        }
    }

    private function buildDashboardChatLink(string $caseId, string $tab): string
    {
        $base = config('app.frontend_url') ?? env('FRONTEND_URL') ?? config('app.url');
        $base = rtrim((string) $base, '/');

        return $base . '/dashboard/case/' . $caseId . '/details-tabs/' . $tab;
    }

    private function resolveLegalSupportMessageContent(AdviseChat $chat): string
    {
        return match ($chat->type) {
            'text' => (string) $chat->message,
            'audio' => 'Audio message: ' . Storage::url($chat->message),
            'image' => 'Image message: ' . Storage::url($chat->message),
            default => 'New legal support message received.',
        };
    }

    /**
     * Get language from request headers.
     */
    private function getLanguageFromRequest(Request $request): string
    {
        $acceptLanguage = $request->header('Accept-Language');
        if ($acceptLanguage) {
            $languages = explode(',', $acceptLanguage);
            if (!empty($languages[0])) {
                $langCode = trim(explode(';', $languages[0])[0]);
                $langCode = strtolower(explode('-', $langCode)[0]);

                $supportedLanguages = ['sv', 'en', 'no', 'da', 'fi', 'de', 'fr'];
                if (in_array($langCode, $supportedLanguages, true)) {
                    return $langCode;
                }
            }
        }

        return 'en';
    }
}


