<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ActivityLog extends Model
{
    use HasUuids;

    protected $table = 'activity_logs';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id', 'action', 'subject_type', 'subject_id', 'ip', 'user_agent', 'context',
    ];

    protected $casts = [
        'context' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}


