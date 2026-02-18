<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupportTicketRequest\StoreSupportTicketRequest;
use App\Http\Requests\SupportTicketRequest\StoreSupportTicketChatRequest;
use App\Http\Requests\SupportTicketRequest\UpdateSupportTicketStatusRequest;
use App\Models\SupportTicket;
use App\Models\SupportTicketChat;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class SupportTicketController extends Controller
{
    /**
     * Get support tickets list for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser();
            $query = SupportTicket::with(['creator', 'case', 'chats' => function($q) {
                $q->latest()->limit(1);
            }]);

            // Filter by user role
            if ($user->hasRole('admin')) {
                // Admin can see all tickets
            } elseif ($user->hasRole('case_manager')) {
                // Case managers can see tickets they created or assigned to their company
                $query->where(function($q) use ($user) {
                    $q->where('created_by', $user->id)
                      ->orWhereHas('creator', function($creatorQuery) use ($user) {
                          $creatorQuery->where('company_id', $user->company_id);
                      });
                });
            } else {
                // Companies can only see their own tickets
                $query->where('created_by', $user->id);
            }

            // Apply status filter
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Search by title
            if ($request->has('search') && !empty($request->search)) {
                $query->where('title', 'like', '%' . $request->search . '%');
            }

            // Order by latest activity (either ticket created_at or latest chat created_at)
            $tickets = $query->orderByRaw('COALESCE((SELECT MAX(created_at) FROM support_ticket_chats WHERE support_ticket_id = support_tickets.id), support_tickets.created_at) DESC')
                             ->paginate($request->get('per_page', 15));

            // Add unread count for each ticket
            $tickets->getCollection()->transform(function ($ticket) use ($user) {
                $ticket->unread_count = $this->calculateUnreadChatCount($ticket, $user);
                return $ticket;
            });

            return response()->json([
                'status' => true,
                'message' => 'Support tickets retrieved successfully.',
                'data' => $tickets,
            ]);

        } catch (\Exception $e) {
            Log::error('Error retrieving support tickets: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve support tickets.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Debug method to list all tickets (for admin only)
     */
    public function debugList(): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser();
            if (!$user->hasRole('admin')) {
                return response()->json([
                    'status' => false,
                    'message' => 'Access denied.',
                ], 403);
            }

            $tickets = SupportTicket::with(['creator'])->get();

            return response()->json([
                'status' => true,
                'message' => 'All tickets retrieved.',
                'data' => $tickets->map(function($ticket) {
                    return [
                        'id' => $ticket->id,
                        'title' => $ticket->title,
                        'status' => $ticket->status,
                        'created_by' => $ticket->created_by,
                        'creator_name' => $ticket->creator ? $ticket->creator->name : 'Unknown',
                        'creator_company' => $ticket->creator ? $ticket->creator->company_name : 'Unknown',
                        'created_at' => $ticket->created_at,
                    ];
                }),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created support ticket.
     */
    public function store(StoreSupportTicketRequest $request): JsonResponse
    {
        try {
            Log::info('Support ticket store request received', [
                'request_data' => $request->all(),
                'user_id' => Auth::id(),
                'headers' => $request->headers->all(),
            ]);

            Log::info('Validating request data');
            $validated = $request->validated();
            Log::info('Request validated successfully', ['validated_data' => $validated]);

            $user = $this->getAuthenticatedUser();
            Log::info('User authenticated', ['user_id' => $user ? $user->id : 'null']);

            if (!$user) {
                Log::error('User not authenticated');
                return response()->json([
                    'status' => false,
                    'message' => 'User not authenticated.',
                ], 401);
            }

            Log::info('Creating support ticket', [
                'user_id' => $user->id,
                'title' => $validated['title'],
                'content_length' => strlen($validated['content'] ?? ''),
            ]);

            // Generate UUID
            try {
                $ticketId = (string) Str::uuid();
            } catch (\Exception $e) {
                Log::error('UUID generation failed, using ordered UUID: ' . $e->getMessage());
                $ticketId = (string) Str::orderedUuid();
            }

            Log::info('Creating support ticket', ['ticket_id' => $ticketId]);

            // Create the support ticket
            $ticket = new SupportTicket([
                'id' => $ticketId,
                'title' => $validated['title'],
                'created_by' => $user->id,
                'status' => $validated['status'] ?? 'open',
                'support_type' => $validated['support_type'],
                'case_id' => $validated['case_id'] ?? null,
            ]);
            $ticket->save();

            Log::info('Support ticket created', ['ticket_id' => $ticket->id]);

            // Load creator relationship
            $ticket->load(['creator']);
            Log::info('Ticket creator loaded', ['creator_exists' => $ticket->creator ? 'yes' : 'no']);

            // Create initial chat message if content is provided
            if (!empty($validated['content'])) {
                Log::info('Creating initial chat message');
                try {
                    $chatId = (string) Str::uuid();
                } catch (\Exception $e) {
                    Log::error('Chat UUID generation failed, using ordered UUID: ' . $e->getMessage());
                    $chatId = (string) Str::orderedUuid();
                }
                $createdFrom = $this->getUserType($user);
                $chat = new SupportTicketChat([
                    'id' => $chatId,
                    'support_ticket_id' => $ticket->id,
                    'content' => $validated['content'],
                    'reply_from' => $user->id,
                    'created_from' => $createdFrom,
                    'read_by_admin' => $createdFrom === 'admin',
                    'read_by_company' => $createdFrom === 'company',
                    'read_by_case_manager' => $createdFrom === 'case_manager',
                ]);
                $chat->save();
                Log::info('Chat message created', ['chat_id' => $chat->id]);
            }

            // Load chats relationship
            $ticket->load(['chats']);

            // Send notification to admin (wrap in try-catch to prevent failure)
            try {
                $notificationService = app(NotificationService::class);
                $notificationService->notifySupportTicketCreated($ticket);
                Log::info('Notification sent successfully');
            } catch (\Exception $e) {
                Log::error('Failed to send notification: ' . $e->getMessage());
                // Don't fail the request if notification fails
            }

            return response()->json([
                'status' => true,
                'message' => 'Support ticket created successfully.',
                'data' => $ticket,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating support ticket: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Failed to create support ticket.',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    /**
     * Get a specific support ticket with chats.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser();
            Log::info('Support ticket show request', [
                'ticket_id' => $id,
                'user_id' => $user ? $user->id : 'null',
                'user_roles' => $user ? $user->roles->pluck('name')->toArray() : [],
            ]);

            // First check if ticket exists at all
            $ticketExists = SupportTicket::where('id', $id)->exists();
            Log::info('Raw ticket existence check', [
                'ticket_id' => $id,
                'exists_in_db' => $ticketExists ? 'yes' : 'no',
            ]);

            $ticket = SupportTicket::with([
                'creator',
                'case',
                'chats' => function ($q) {
                    $q->with(['sender', 'receiver'])->orderBy('created_at', 'asc');
                },
            ])
            ->where('id', $id)
            ->first();

            Log::info('Ticket query result', [
                'ticket_found' => $ticket ? 'yes' : 'no',
                'ticket_creator' => $ticket ? $ticket->created_by : 'null',
                'ticket_title' => $ticket ? $ticket->title : 'null',
                'ticket_status' => $ticket ? $ticket->status : 'null',
            ]);

            // Log all existing tickets for debugging
            $allTickets = SupportTicket::select('id', 'title', 'created_by', 'status')->get();
            Log::info('All existing tickets', [
                'count' => $allTickets->count(),
                'tickets' => $allTickets->map(function($t) {
                    return [
                        'id' => $t->id,
                        'title' => $t->title,
                        'created_by' => $t->created_by,
                        'status' => $t->status,
                    ];
                })->toArray(),
            ]);

            if (!$ticket) {
                Log::warning('Support ticket not found', ['ticket_id' => $id]);
                return response()->json([
                    'status' => false,
                    'message' => 'Support ticket not found.',
                ], 404);
            }

            // Check permissions
            $canAccess = $this->canAccessTicket($ticket, $user);
            Log::info('Access check result', [
                'can_access' => $canAccess,
                'user_has_admin_role' => $user->hasRole('admin'),
                'user_has_case_manager_role' => $user->hasRole('case_manager'),
            ]);

            if (!$canAccess) {
                Log::warning('Access denied for ticket', [
                    'ticket_id' => $id,
                    'user_id' => $user->id,
                    'user_roles' => $user->roles->pluck('name')->toArray(),
                    'ticket_creator' => $ticket->created_by,
                ]);

                $roleNames = $user->roles->pluck('name')->toArray();
                $isAdmin = in_array('admin', $roleNames);
                $isCaseManager = in_array('case_manager', $roleNames);

                $message = 'You do not have permission to view this ticket.';
                if (!$isAdmin && !$isCaseManager) {
                    $message .= ' Only company users can view their own tickets.';
                } elseif ($isCaseManager) {
                    $message .= ' Case managers can only view tickets from their company.';
                }

                return response()->json([
                    'status' => false,
                    'message' => $message,
                ], 403);
            }

            // Mark chats as read for current user
            $this->markChatsAsReadForUser($ticket, $user);

            return response()->json([
                'status' => true,
                'message' => 'Support ticket retrieved successfully.',
                'data' => $ticket,
            ]);

        } catch (\Exception $e) {
            Log::error('Error retrieving support ticket: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve support ticket.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update support ticket status.
     */
    public function updateStatus(UpdateSupportTicketStatusRequest $request, string $id): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser();
            $ticket = SupportTicket::find($id);

            if (!$ticket) {
                return response()->json([
                    'status' => false,
                    'message' => 'Support ticket not found.',
                ], 404);
            }

            // Check permissions (only admin can update status)
            if (!$user->hasRole('admin')) {
                return response()->json([
                    'status' => false,
                    'message' => 'Only administrators can update ticket status.',
                ], 403);
            }

            $ticket->update(['status' => $request->status]);

            // Notify the ticket creator
            $notificationService = app(NotificationService::class);
            $notificationService->notifySupportTicketStatusUpdated($ticket, $ticket->getOriginal('status'), $ticket->status);

            return response()->json([
                'status' => true,
                'message' => 'Support ticket status updated successfully.',
                'data' => $ticket,
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating support ticket status: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to update support ticket status.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a new chat message for a support ticket.
     */
    public function storeChat(StoreSupportTicketChatRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $user = $this->getAuthenticatedUser();
            $ticket = SupportTicket::find($validated['support_ticket_id']);

            if (!$ticket) {
                return response()->json([
                    'status' => false,
                    'message' => 'Support ticket not found.',
                ], 404);
            }

            // Check permissions
            if (!$this->canAccessTicket($ticket, $user)) {
                return response()->json([
                    'status' => false,
                    'message' => 'You do not have permission to reply to this ticket.',
                ], 403);
            }

            $attachmentPath = null;
            if ($request->hasFile('attachment')) {
                $attachmentPath = $request->file('attachment')->store('support-tickets', 'public');
            }

            // Determine reply_to based on user role
            $replyTo = $this->getReplyToUser($ticket, $user);

            $createdFrom = $this->getUserType($user);
            // Create chat message with read flags
            $chat = SupportTicketChat::create([
                'id' => (string) Str::uuid(),
                'support_ticket_id' => $ticket->id,
                'content' => $validated['content'],
                'reply_from' => $user->id,
                'reply_to' => $replyTo,
                'attachment' => $attachmentPath,
                'created_from' => $createdFrom,
                'read_by_admin' => $createdFrom === 'admin',
                'read_by_company' => $createdFrom === 'company',
                'read_by_case_manager' => $createdFrom === 'case_manager',
            ]);

            // Ensure relations are loaded for client display
            $chat->load(['sender', 'receiver']);

            // Send notification to the other party
            $notificationService = app(NotificationService::class);
            $notificationService->notifySupportTicketReply($ticket, $chat);

            return response()->json([
                'status' => true,
                'message' => 'Reply sent successfully.',
                'data' => $chat,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error storing chat message: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to send reply.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get chat messages for a support ticket.
     */
    public function getChats(string $id): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser();
            $ticket = SupportTicket::find($id);

            if (!$ticket) {
                return response()->json([
                    'status' => false,
                    'message' => 'Support ticket not found.',
                ], 404);
            }

            // Check permissions
            if (!$this->canAccessTicket($ticket, $user)) {
                return response()->json([
                    'status' => false,
                    'message' => 'You do not have permission to view this ticket.',
                ], 403);
            }

            $chats = SupportTicketChat::with(['sender', 'receiver'])
                                     ->where('support_ticket_id', $id)
                                     ->orderBy('created_at', 'asc')
                                     ->get();

            // Mark chats as read for current user
            $this->markChatsAsReadForUser($ticket, $user);

            return response()->json([
                'status' => true,
                'message' => 'Chat messages retrieved successfully.',
                'data' => $chats,
            ]);

        } catch (\Exception $e) {
            Log::error('Error retrieving chat messages: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve chat messages.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get unread chat count for a ticket.
     */
    public function getUnreadChatCount(string $id): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser();
            $ticket = SupportTicket::find($id);

            if (!$ticket) {
                return response()->json([
                    'status' => false,
                    'message' => 'Support ticket not found.',
                ], 404);
            }

            // Check permissions
            if (!$this->canAccessTicket($ticket, $user)) {
                return response()->json([
                    'status' => false,
                    'message' => 'You do not have permission to view this ticket.',
                ], 403);
            }

            $unreadCount = $this->calculateUnreadChatCount($ticket, $user);

            return response()->json([
                'status' => true,
                'message' => 'Unread count retrieved successfully.',
                'data' => ['unread_count' => $unreadCount],
            ]);

        } catch (\Exception $e) {
            Log::error('Error retrieving unread count: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve unread count.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark chats as read for the current user.
     */
    public function markChatsAsRead(Request $request, string $id): JsonResponse
    {
        try {
            $user = $this->getAuthenticatedUser();
            $ticket = SupportTicket::find($id);

            if (!$ticket || !$user) {
                return response()->json([
                    'status' => false,
                    'message' => $ticket ? 'Authentication required.' : 'Support ticket not found.',
                ], $ticket ? 401 : 404);
            }

            // Check permissions
            if (!$this->canAccessTicket($ticket, $user)) {
                return response()->json([
                    'status' => false,
                    'message' => 'You do not have permission to access this ticket.',
                ], 403);
            }

            $this->markChatsAsReadForUser($ticket, $user);

            return response()->json([
                'status' => true,
                'message' => 'Chats marked as read successfully.',
            ]);

        } catch (\Exception $e) {
            Log::error('Error marking chats as read: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to mark chats as read.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Helper method to check if user can access a ticket.
     */
    private function canAccessTicket(SupportTicket $ticket, User $user): bool
    {
        try {
            if ($user->hasRole('admin')) {
                Log::info('Admin access granted');
                return true;
            }

            if ($user->hasRole('case_manager')) {
                $isCreator = $ticket->created_by === $user->id;
                $sameCompany = ($user->company_id && $ticket->creator && $ticket->creator->company_id === $user->company_id);

                Log::info('Case manager access check', [
                    'is_creator' => $isCreator,
                    'same_company' => $sameCompany,
                    'user_company_id' => $user->company_id,
                    'ticket_creator_company_id' => $ticket->creator ? $ticket->creator->company_id : 'null',
                ]);

                return $isCreator || $sameCompany;
            }

            // Company users can only access their own tickets
            $isOwnTicket = $ticket->created_by === $user->id;
            Log::info('Company user access check', [
                'is_own_ticket' => $isOwnTicket,
                'ticket_created_by' => $ticket->created_by,
                'user_id' => $user->id,
            ]);

            return $isOwnTicket;
        } catch (\Exception $e) {
            Log::error('Error in canAccessTicket: ' . $e->getMessage(), [
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'exception' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Helper method to get user type.
     */
    private function getUserType(User $user): string
    {
        try {
            if ($user->hasRole('admin')) {
                return 'admin';
            } elseif ($user->hasRole('case_manager')) {
                return 'case_manager';
            } else {
                return 'company';
            }
        } catch (\Exception $e) {
            Log::error('Error in getUserType: ' . $e->getMessage());
            // Default to company if role checking fails
            return 'company';
        }
    }

    /**
     * Helper to map role to read-flag column.
     */
    private function roleToFlag(string $role): string
    {
        return match ($role) {
            'admin' => 'read_by_admin',
            'case_manager' => 'read_by_case_manager',
            default => 'read_by_company',
        };
    }

    /**
     * Helper method to determine who to reply to.
     */
    private function getReplyToUser(SupportTicket $ticket, User $user): ?string
    {
        if ($user->hasRole('admin')) {
            // Admin replying to ticket creator
            return $ticket->created_by;
        } else {
            // Company/case manager replying to admin (find latest admin reply)
            $latestAdminChat = $ticket->chats()
                                     ->where('created_from', 'admin')
                                     ->latest()
                                     ->first();

            return $latestAdminChat ? $latestAdminChat->reply_from : null;
        }
    }

    /**
     * Helper method to calculate unread chat count.
     */
    private function calculateUnreadChatCount(SupportTicket $ticket, User $user): int
    {
        $flag = $this->roleToFlag($this->getUserType($user));

        return $ticket->chats()
                     ->where($flag, false)
                     ->count();
    }

    /**
     * Helper method to mark chats as read for a user.
     */
    private function markChatsAsReadForUser(SupportTicket $ticket, User $user): void
    {
        $flag = $this->roleToFlag($this->getUserType($user));

        SupportTicketChat::where('support_ticket_id', $ticket->id)
            ->where($flag, false)
            ->update([$flag => true]);
    }

    /**
     * Get the currently authenticated user with proper typing.
     *
     * @throws \RuntimeException
     */
    private function getAuthenticatedUser(): User
    {
        /** @var User|null $user */
        $user = Auth::user();

        return $user instanceof User ? $user : null;
    }

}