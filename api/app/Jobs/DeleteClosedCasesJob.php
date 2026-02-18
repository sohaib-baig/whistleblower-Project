<?php

namespace App\Jobs;

use App\Models\AdminSettings;
use App\Models\CaseModel;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DeleteClosedCasesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $settings = AdminSettings::first();

        // Check if delete closed cases is enabled
        if (!$settings || !$settings->delete_closed_cases) {
            Log::info('Delete closed cases is disabled. Skipping job execution.');
            return;
        }

        // Check if period and period type are set
        if (!$settings->delete_closed_cases_period || !$settings->delete_closed_cases_period_type) {
            Log::info('Delete closed cases period or period type is not set. Skipping job execution.');
            return;
        }

        $period = $settings->delete_closed_cases_period;
        $periodType = $settings->delete_closed_cases_period_type;

        // Calculate the cutoff date based on period and period type
        $cutoffDate = $this->calculateCutoffDate($period, $periodType);

        // Find all closed cases that were closed before the cutoff date
        $casesToDelete = CaseModel::where('status', 'closed')
            ->where('updated_at', '<', $cutoffDate)
            ->get();

        $deletedCount = 0;

        foreach ($casesToDelete as $case) {
            // Use forceDelete to permanently delete (since we're using SoftDeletes)
            $case->forceDelete();
            $deletedCount++;
        }

        Log::info("Deleted {$deletedCount} closed cases that were closed before {$cutoffDate->toDateTimeString()}");
    }

    /**
     * Calculate the cutoff date based on period and period type.
     */
    private function calculateCutoffDate(int $period, string $periodType): Carbon
    {
        return match ($periodType) {
            'daily' => Carbon::now()->subDays($period),
            'weekly' => Carbon::now()->subWeeks($period),
            'monthly' => Carbon::now()->subMonths($period),
            'yearly' => Carbon::now()->subYears($period),
            default => Carbon::now()->subDays($period), // Default to days if unknown
        };
    }
}

