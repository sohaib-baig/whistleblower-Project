<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\UsesUuid;
use Illuminate\Support\Facades\Auth;

class SupportTicket extends Model
{
    use SoftDeletes;
    use UsesUuid;

    protected $table = 'support_tickets';

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'title',
        'created_by',
        'status',
        'support_type',
        'case_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user who created the support ticket.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the chats for the support ticket.
     */
    public function chats(): HasMany
    {
        return $this->hasMany(SupportTicketChat::class, 'support_ticket_id');
    }

    /**
     * Get the case associated with the support ticket (if legal support).
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * Get unread chat count for the current user.
     */
    public function getUnreadChatCountAttribute(): int
    {
        $user = Auth::user();
        if (!$user) {
            return 0;
        }

        return $this->chats()
            ->where('reply_to', $user->id)
            ->whereRaw('(SELECT COUNT(*) FROM support_ticket_chats stc2 WHERE stc2.support_ticket_id = support_ticket_chats.support_ticket_id AND stc2.created_at > support_ticket_chats.created_at AND stc2.reply_from = ?) = 0', [$user->id])
            ->count();
    }
}
