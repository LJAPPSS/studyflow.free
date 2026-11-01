import { useMemo } from 'react';
import { BookOpen, CalendarDays, Clock, GraduationCap, Settings } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { navigate } from '@/lib/router';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS, WEEKDAYS } from '@/lib/constants';
import { daysUntil, formatDecimal, formatRelativeDays, formatShortDate, formatTime, todayIso } from '@/lib/format';
import { BarChart } from '@/components/ui/BarChart';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function DashboardPage() {
  const { data } = useStudyData();
  const today = todayIso();

  const upcomingExams = useMemo(
    () => data.exams.filter((exam) => exam.exam_date >= today).sort((a, b) => a.exam_date.localeCompare(b.exam_date)),
    [data.exams, today],
  );

  const subjectById = useMemo(() => new Map(data.subjects.map((subject) => [subject.id, subject])), [data.subjects]);

  const examBars = upcomingExams.slice(0, 6).map((exam) => {
    const subject = subjectById.get(exam.subject_id);
    const days = daysUntil(exam.exam_date);
    return {
      key: exam.id,
      label: subject?.name.slice(0, 3) ?? 'Exa',
      height: Math.max(20, 100 - Math.min(days, 25) * 3.2),
    };
  });

  const confidenceAverage =
    data.subjects.length > 0 ? data.subjects.reduce((sum, subject) => sum + subject.confidence, 0) / data.subjects.length : 0;
  const confidenceBars = data.subjects.slice(0, 6).map((subject) => ({
    key: subject.id,
    label: subject.name.slice(0, 3),
    height: Math.max(8, subject.confidence * 20),
  }));

  const minutesPerWeekday = useMemo(() => {
    const totals = WEEKDAYS.map(() => 0);
    for (const block of data.availability) {
      if (block.kind !== 'studietijd' || block.weekday === null) continue;
      totals[block.weekday] += toMinutes(block.end_time) - toMinutes(block.start_time);
    }
    return totals;
  }, [data.availability]);
  const totalStudyHours = minutesPerWeekday.reduce((sum, minutes) => sum + minutes, 0) / 60;
  const maxDayMinutes = Math.max(1, ...minutesPerWeekday);
  const studyBars = WEEKDAYS.map((day, index) => ({
    key: String(day.value),
    label: day.short,
    height: Math.max(6, (minutesPerWeekday[index] / maxDayMinutes) * 100),
  }));

  const firstName = data.profile?.display_name.split(' ')[0] ?? '';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-rise">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{formatShortDate(today)}</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            {upcomingExams.length === 0
              ? 'Nog geen komende examens gepland.'
              : `Je hebt ${upcomingExams.length} ${upcomingExams.length === 1 ? 'komend examen' : 'komende examens'} gepland.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/vakken')}>
            <CalendarDays className="h-4 w-4" />
            Examen toevoegen
          </Button>
        </div>
      </div>

      {!data.profile?.onboarding_completed && (
        <div className="animate-rise flex flex-col gap-4 rounded-playful border-[3px] border-outline bg-pastel-sand p-5 shadow-hard sm:flex-row sm:items-center sm:justify-between dark:bg-panel">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-neutral-800 dark:text-neutral-200" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">Je studieomgeving is nog niet helemaal klaar</p>
              <p className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-400">Vul je vakken, examens en studietijden aan wanneer het jou past.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/onboarding')} className="shrink-0">
            Verder instellen
          </Button>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          title="Komende examens"
          value={String(upcomingExams.length)}
          caption={upcomingExams[0] ? `Eerstvolgende ${formatRelativeDays(daysUntil(upcomingExams[0].exam_date))}` : 'Geen examens gepland'}
          tone="bg-pastel-lavender"
          delay={0}
        >
          {examBars.length > 0 ? (
            <BarChart bars={examBars} />
          ) : (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Voeg examens toe om hier je aftellingen te zien.</p>
          )}
        </StatCard>

        <StatCard
          title="Gemiddeld zelfvertrouwen"
          value={data.subjects.length > 0 ? `${formatDecimal(confidenceAverage)}/5` : '-'}
          caption={`Over ${data.subjects.length} ${data.subjects.length === 1 ? 'vak' : 'vakken'}`}
          tone="bg-pastel-sky"
          delay={100}
        >
          {confidenceBars.length > 0 ? (
            <BarChart bars={confidenceBars} />
          ) : (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Voeg vakken toe om je zelfvertrouwen bij te houden.</p>
          )}
        </StatCard>

        <StatCard
          title="Studietijd per week"
          value={`${formatDecimal(totalStudyHours)} u`}
          caption="Op basis van je beschikbaarheid"
          tone="bg-pastel-rose"
          delay={200}
        >
          <BarChart bars={studyBars} />
        </StatCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard title="Eerstvolgende examens" action={{ label: 'Alle vakken', path: '/vakken' }} className="xl:col-span-2">
          {upcomingExams.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nog geen examens gepland"
              description="Voeg je examendatums toe, dan zie je hier hoeveel dagen je nog hebt."
              action={
                <Button variant="secondary" size="sm" onClick={() => navigate('/vakken')}>
                  Examen toevoegen
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {upcomingExams.slice(0, 5).map((exam, index) => {
                const subject = subjectById.get(exam.subject_id);
                const days = daysUntil(exam.exam_date);
                const colorKey = subject?.color ?? 'slate';
                return (
                  <li
                    key={exam.id}
                    className="animate-rise flex items-center gap-4 rounded-2xl p-3 transition-all duration-200 hover:translate-x-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-outline text-sm font-semibold',
                        SUBJECT_COLORS[colorKey].soft,
                      )}
                    >
                      {subject?.name.slice(0, 1).toUpperCase() ?? '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{subject?.name ?? 'Examen'}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {formatShortDate(exam.exam_date)}
                        {exam.start_time ? ` · ${formatTime(exam.start_time)}` : ''}
                        {exam.duration_minutes ? ` · ${exam.duration_minutes} min` : ''}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                        days <= 7 ? 'bg-error-100 text-error-700 dark:bg-error-600/20 dark:text-error-300' : 'border-2 border-outline bg-accent-600 text-white dark:bg-accent-500',
                      )}
                    >
                      {formatRelativeDays(days)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Snelle acties">
          <ul className="space-y-2">
            {[
              { label: 'Examen toevoegen', description: 'Plan een nieuw examen in', icon: CalendarDays, path: '/vakken' },
              { label: 'Beschikbaarheid instellen', description: 'Wanneer kun je studeren?', icon: Clock, path: '/instellingen/beschikbaarheid' },
              { label: 'Instellingen', description: 'Profiel, schooljaar en weergave', icon: Settings, path: '/instellingen' },
            ].map(({ label, description, icon: Icon, path }) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => navigate(path)}
                  className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 hover:translate-x-1 hover:bg-neutral-100 active:scale-[0.98] dark:hover:bg-neutral-800"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pastel-lavender text-neutral-900 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 dark:bg-neutral-800 dark:text-neutral-100">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</span>
                    <span className="block truncate text-xs text-neutral-600 dark:text-neutral-400">{description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Mijn vakken" action={{ label: 'Beheren', path: '/vakken' }} className="xl:col-span-3">
          {data.subjects.length === 0 ? (
            <EmptyState icon={BookOpen} title="Nog geen vakken" description="Voeg je schoolvakken toe om ze te gebruiken in je planning." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.subjects.map((subject, index) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => navigate('/vakken')}
                  className="animate-rise group rounded-playful border-[3px] border-outline bg-panel p-4 text-left shadow-hard-sm transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:bg-neutral-800"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn('h-3 w-3 rounded-full transition-transform duration-300 group-hover:scale-125', SUBJECT_COLORS[subject.color].dot)} />
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{subject.name}</span>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                      <span>Zelfvertrouwen</span>
                      <span>{subject.confidence}/5</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div className={cn('h-full rounded-full transition-all duration-700', SUBJECT_COLORS[subject.color].bar)} style={{ width: `${subject.confidence * 20}%` }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
