import { useState, type FormEvent } from 'react';
import { Target } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { SectionCard } from '@/components/ui/SectionCard';
import { useToast } from '@/components/ui/Toast';
import { toUserMessage } from '@/lib/errors';
import { formatDuration, formatDecimal, todayIso } from '@/lib/format';
import { minutesSince, studyRecords, weekStart } from '@/lib/studyStats';
import { setWeeklyGoalMinutes } from '@/services/profile';

export function WeeklyGoalCard() {
  const { data, userId, refresh } = useStudyData();
  const { show } = useToast();
  const goal = data.profile?.weekly_goal_minutes ?? null;
  const [hours, setHours] = useState(goal ? formatDecimal(goal / 60) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const records = studyRecords(data.sessions, data.focusSessions);
  const weekMinutes = minutesSince(records, weekStart(todayIso()));
  const percent = goal ? Math.min(100, Math.round((weekMinutes / goal) * 100)) : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(hours.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0 || value > 168) {
      setError('Vul een aantal uren in tussen 0 en 168.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setWeeklyGoalMinutes(userId, Math.round(value * 60));
      await refresh();
      show('Weekdoel opgeslagen.');
    } catch (err) {
      setError(toUserMessage(err, 'Het weekdoel kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Weekdoel">
      <div className="space-y-5">
        {goal ? (
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-neutral-700 dark:text-neutral-300">
                {formatDuration(weekMinutes)} van {formatDuration(goal)}
              </span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">{percent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border-2 border-outline bg-panel">
              <div className="h-full rounded-full bg-accent-600 transition-all duration-700 dark:bg-accent-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Stel een doel in om je studietijd per week bij te houden.</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
          <Field label="Uren per week" htmlFor="weekly-goal" error={error} className="flex-1">
            <input
              id="weekly-goal"
              inputMode="decimal"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              placeholder="bv. 10"
              className={inputClass}
            />
          </Field>
          <Button type="submit" loading={saving}>
            <Target className="h-4 w-4" />
            Doel opslaan
          </Button>
        </form>
      </div>
    </SectionCard>
  );
}
