<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Traits\UsesUuid;

class Order extends Model
{
    use HasFactory, SoftDeletes, UsesUuid;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'created_by',
        'company_id',
        'invoice_number',
        'status',
        'invoice_date',
        'title',
        'price',
        'vat',
        'payment_type',
        'payment_response',
        'payment_attachment',
        'stripe_subscription_id',
        'stripe_customer_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'invoice_date' => 'date',
        'price' => 'decimal:2',
        'vat' => 'decimal:2',
    ];

    /**
     * Get the user who created this order.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the company (user) associated with this order.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_id');
    }

    /**
     * Generate a unique invoice number.
     *
     * @return string
     */
    public static function generateInvoiceNumber(): string
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');
        
        // Get the last invoice number for today
        $lastOrder = self::whereDate('created_at', today())
            ->orderBy('created_at', 'desc')
            ->first();

        if ($lastOrder && preg_match('/\d+$/', $lastOrder->invoice_number, $matches)) {
            $sequence = intval($matches[0]) + 1;
        } else {
            $sequence = 1;
        }

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }
}
