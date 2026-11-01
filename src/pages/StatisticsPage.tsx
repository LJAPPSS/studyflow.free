import { useMemo } from 'react';
import { Award, BarChart3, Clock, Lock } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { BarChart, type BarChartBar } from '@/components/ui/BarChart';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS, type SubjectColorKey } from '@/lib/constants';
import { formatDuration, formatWeekdayShort, todayIso } from '@/lib/format';
import { navigate } from '@/lib/router';
import { buildBadges, currentStreak, minutesByDate, minutesSince, shiftDate, studyRecords, weekStart } from '@/lib/studyStats';

const LAST_DAYS = 7;

export function StatisticsPage() {
  const { data } = useStudyData();
  const today = todayIso();

  const completedPlanned = useMemo(() => data.sessions.filter((session) => session.completed), [data.sessions]);
  const records = useMemo(() => studyRecords(data.sessions, data.focusSessions), [data.sessions, data.focusSessions]);
  const totalMinutes = useMemo(() => records.reduce((sum, record) => sum + record.duration_minutes, 0), [records]);
  const streak = useMemo(() => currentStreak(records, today), [records, today]);

  const lastDates = useMemo(
    () => Array.from({ length: LAST_DAYS }, (_, index) => shiftDate(today, index - (LAST_DAYS - 1))),
    [today],
  );
  const dailyTotals = useMemo(() => minutesByDate(records), [records]);
  const lastDaysMinutes = lastDates.reduce((sum, date) => sum + (dailyTotals.get(date) ?? 0), 0);
  const maxDayMinutes = Math.max(1, ...lastDates.map((date) => dailyTotals.get(date) ?? 0));
  const dayBars: BarChartBar[] = lastDates.map((date) => {
    const minutes = dailyTotals.get(date) ?? 0;
    return {
      key: date,
      label: formatWeekdayShort(date),
      height: Math.max(6, (minutes / maxDayMinutes) * 100),
      value: formatDuration(minutes),
    };
  });

  const subjectRows = useMemo(() => {
    const rows: { key: string; name: string; color: SubjectColorKey | null; minutes: number }[] = data.subjects.map((subject) => ({
      key: subject.id,
      name: subject.name,
      color: subject.color,
      minutes: records
        .filter((record) => record.subject_id === subject.id)
        .reduce((sum, record) => sum + record.duration_minutes, 0),
    }));
    const withoutSubject = records
      .filter((record) => record.subject_id === null)
      .reduce((sum, record) => sum + record.duration_minutes, 0);
    if (withoutSubject > 0) rows.push({ key: 'none', name: 'Focus zonder vak', color: null, minutes: withoutSubject });
    return rows.sort((a, b) => b.minutes - a.minutes);
  }, [data.subjects, records]);
  const maxSubjectMinutes = Math.max(1, ...subjectRows.map((row) => row.minutes));

  const badges = useMemo(
    () =>
      buildBadges({
        records,
        focusCount: data.focusSessions.length,
        streak,
        weekMinutes: minutesSince(records, weekStart(today)),
        weeklyGoalMinutes: data.profile?.weekly_goal_minutes ?? null,
        gradeCount: data.grades.length,
      }),
    [records, data.focusSessions.length, data.profile?.weekly_goal_minutes, data.grades.length, streak, today],
  );

  const completionPercent = data.sessions.length > 0 ? Math.round((completedPlanned.length / data.sessions.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Statistieken</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">Hoeveel je studeert, hoe consequent je bent en waar je tijd naartoe gaat.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          title="Studietijd afgelopen 7 dagen"
          value={formatDuration(lastDaysMinutes)}
          caption={`Totaal sinds je begon: ${formatDuration(totalMinutes)}`}
          tone="bg-pastel-sky"
          delay={0}
        >
          <BarChart bars={dayBars} />
        </StatCard>

        <StatCard
          title="Huidige reeks"
          value={`${streak} ${streak === 1 ? 'dag' : 'dagen'}`}
          caption="Opeenvolgende dagen met een afgeronde sessie"
          tone="bg-pastel-lavender"
          delay={100}
        >
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {streak === 0 ? 'Rond vandaag een sessie af om je reeks te starten.' : 'Mooi bezig, hou dit vol!'}
          </p>
        </StatCard>

        <StatCard
          title="Afgeronde planner-sessies"
          value={`${completedPlanned.length}`}
          caption={`${completionPercent}% van ${data.sessions.length} ingeplande sessies`}
          tone="bg-pastel-rose"
          delay={200}
        >
          <div className="h-2.5 overflow-hidden rounded-full border-2 border-outline bg-panel">
            <div className="h-full rounded-full bg-accent-600 transition-all duration-700 dark:bg-accent-500" style={{ width: `${completionPercent}%` }} />
          </div>
        </StatCard>
      </div>

      <SectionCard title="Studietijd per vak">
        {records.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Nog geen afgeronde sessies"
            description="Rond sessies af in de planner. Dan zie je hier hoeveel tijd je per vak hebt gestudeerd."
            action={
              <Button variant="secondary" size="sm" onClick={() => navigate('/planner')}>
                <Clock className="h-4 w-4" />
                Naar de planner
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {subjectRows.map(({ key, name, color, minutes }) => (
              <li key={key}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className={cn('h-3 w-3 shrink-0 rounded-full', color ? SUBJECT_COLORS[color].dot : 'bg-neutral-400')} />
                    <span className="truncate font-medium text-neutral-900 dark:text-neutral-100">{name}</span>
                  </span>
                  <span className="shrink-0 text-neutral-600 dark:text-neutral-400">{formatDuration(minutes)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', color ? SUBJECT_COLORS[color].bar : 'bg-neutral-500')}
                    style={{ width: `${(minutes / maxSubjectMinutes) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Badges">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {badges.map((badge) => (
            <li
              key={badge.key}
              className={cn(
                'flex items-start gap-3 rounded-playful border-[3px] p-4',
                badge.earned ? 'border-outline bg-panel shadow-hard-sm dark:bg-neutral-800' : 'border-dashed border-neutral-300 dark:border-neutral-700',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2',
                  badge.earned ? 'border-outline bg-accent-600 text-white dark:bg-accent-500' : 'border-neutral-300 text-neutral-400 dark:border-neutral-700',
                )}
              >
                {badge.earned ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{badge.label}</p>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">{badge.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
