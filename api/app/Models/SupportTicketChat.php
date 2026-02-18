<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Traits\UsesUuid;

class SupportTicketChat extends Model
{
    use SoftDeletes;
    use UsesUuid;

    protected $table = 'support_ticket_chats';

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'support_ticket_id',
        'content',
        'reply_from',
        'reply_to',
        'attachment',
        'created_from',
        'read_by_admin',
        'read_by_company',
        'read_by_case_manager',
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
        'read_by_admin' => 'boolean',
        'read_by_company' => 'boolean',
        'read_by_case_manager' => 'boolean',
    ];

    /**
     * Get the support ticket that owns the chat.
     */
    public function supportTicket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }

    /**
     * Get the user who sent the reply.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reply_from');
    }

    /**
     * Get the user who should receive the reply.
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reply_to');
    }
}
