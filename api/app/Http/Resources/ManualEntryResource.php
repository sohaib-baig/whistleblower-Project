<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ManualEntryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'media_buyer_id' => $this->media_buyer_id,
            'report_date' => $this->report_date,
            'total_spend' => (float) $this->total_spend,
            'total_revenue' => (float) $this->total_revenue,
            'total_profit' => (float) $this->total_profit,
            'margins' => (float) $this->margins,
            'campaign_breakdown' => $this->campaign_breakdown ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'mediaBuyer' => $this->whenLoaded('mediaBuyer', function () {
                return [
                    'id' => $this->mediaBuyer->id,
                    'name' => $this->mediaBuyer->name,
                    'email' => $this->mediaBuyer->email,
                ];
            }),
        ];
    }
}
