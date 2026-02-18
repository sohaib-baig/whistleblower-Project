<?php

namespace App\Services;

use Illuminate\Http\Request;
use App\Models\ActivityLog;

class AuditLogger
{
    public function log(Request $request, string $action, ?string $subjectType = null, ?string $subjectId = null, array $context = []): void
    {
        try {
            ActivityLog::create([
                'user_id' => optional($request->user())->id,
                'action' => $action,
                'subject_type' => $subjectType,
                'subject_id' => $subjectId,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
                'context' => $this->sanitizeContext($context),
            ]);
        } catch (\Throwable $e) {
            // Swallow to avoid impacting primary flow; rely on external logs for failures
        }
    }

    private function sanitizeContext(array $context): array
    {
        unset($context['password'], $context['password_confirmation'], $context['token'], $context['secret']);
        return $context;
    }
}


