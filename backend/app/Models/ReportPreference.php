<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;
use Carbon\Carbon;

class ReportPreference extends Model
{
    use HasFactory, BelongsToTenant;

    public const LOOP_FREQUENCY_MINUTES = [
        'every_5_minutes'  => 5,
        'every_10_minutes' => 10,
        'every_15_minutes' => 15,
        'every_30_minutes' => 30,
        'hourly'           => 60,
        'every_2_hours'    => 120,
        'every_6_hours'    => 360,
    ];

    protected $fillable = [
        'tenant_id',
        'report_type',
        'frequency',
        'time_of_day',
        'day_of_week',
        'day_of_month',
        'interval_minutes',
        'is_enabled',
        'delivery_method',
        'recipient_email',
        'last_sent_at',
        'next_run_at',
    ];

    protected $casts = [
        'is_enabled'       => 'boolean',
        'last_sent_at'     => 'datetime',
        'next_run_at'      => 'datetime',
        'day_of_month'     => 'integer',
        'interval_minutes' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isLoopSchedule(): bool
    {
        return $this->frequency === 'custom_minutes'
            || array_key_exists($this->frequency, self::LOOP_FREQUENCY_MINUTES);
    }

    public function resolveLoopMinutes(): int
    {
        if (!empty($this->interval_minutes) && (int) $this->interval_minutes > 0) {
            return (int) $this->interval_minutes;
        }

        return self::LOOP_FREQUENCY_MINUTES[$this->frequency] ?? 5;
    }

    /**
     * Compute the next scheduled execution timestamp after an automated run completes.
     * Returns null when a one-time scheduled report completes.
     */
    public function computeNextRunAfterExecution(): ?Carbon
    {
        $now = Carbon::now();

        if ($this->frequency === 'scheduled_once') {
            return null;
        }

        if ($this->isLoopSchedule()) {
            return $now->copy()->addMinutes($this->resolveLoopMinutes());
        }

        $base = $this->next_run_at ? Carbon::parse($this->next_run_at) : null;

        if ($this->frequency === 'daily') {
            if ($base) {
                $next = $base->copy()->addDay();
                while ($next->lte($now)) {
                    $next->addDay();
                }
                return $next;
            }
            if (!empty($this->time_of_day)) {
                $today = Carbon::parse($now->toDateString() . ' ' . $this->time_of_day);
                return $today->lte($now) ? $today->addDay() : $today;
            }
            return $now->copy()->addDay();
        }

        if ($this->frequency === 'weekly') {
            if ($base) {
                $next = $base->copy()->addWeek();
                while ($next->lte($now)) {
                    $next->addWeek();
                }
                return $next;
            }
            $dayOfWeek = $this->day_of_week ?: 'monday';
            $time = $this->time_of_day ?: '09:00';
            return Carbon::parse("next {$dayOfWeek} {$time}");
        }

        if ($this->frequency === 'monthly') {
            if ($base) {
                $next = $base->copy()->addMonth();
                while ($next->lte($now)) {
                    $next->addMonth();
                }
                return $next;
            }
            $day = min((int) ($this->day_of_month ?: 1), 28);
            $time = $this->time_of_day ?: '09:00';
            $next = $now->copy()->setDay($day)->setTimeFromTimeString($time);
            if ($next->lte($now)) {
                $next->addMonth();
            }
            return $next;
        }

        return $now->copy()->addMinutes(5);
    }
}
