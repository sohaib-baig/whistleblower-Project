<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\UsesUuid;

class CaseAttachment extends Model
{
    use UsesUuid;

    protected $table = 'case_attachments';

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'case_id',
        'created_by',
        'attachment_type',
        'attachment_name',
        'attachment_path',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the case that owns the attachment.
     */
    public function case()
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    /**
     * Get the user who created the attachment.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}











