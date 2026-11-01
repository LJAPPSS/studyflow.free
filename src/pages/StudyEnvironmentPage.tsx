import { useMemo } from 'react';
import { BookOpen, CalendarClock, Check, GraduationCap } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard } from '@/components/ui/SectionCard';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/constants';
import { daysUntil, formatRelativeDays, formatShortDate, formatTime, todayIso } from '@/lib/format';
import { navigate } from '@/lib/router';
import { WeeklyGoalCard } from '@/components/study/WeeklyGoalCard';

export function StudyEnvironmentPage() {
  const { data } = useStudyData();
  const today = todayIso();

  const subjectById = useMemo(() => new Map(data.subjects.map((subject) => [subject.id, subject])), [data.subjects]);

  const todaySessions = useMemo(
    () =>
      data.sessions
        .filter((session) => session.session_date === today)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [data.sessions, today],
  );
  const todayDone = todaySessions.filter((session) => session.completed).length;

  const upcomingExams = useMemo(
    () => data.exams.filter((exam) => exam.exam_date >= today).sort((a, b) => a.exam_date.localeCompare(b.exam_date)),
    [data.exams, today],
  );

  const progressRows = useMemo(
    () =>
      data.subjects.map((subject) => {
        const sessions = data.sessions.filter((session) => session.subject_id === subject.id);
        const done = sessions.filter((session) => session.completed).length;
        const nextExam = upcomingExams.find((exam) => exam.subject_id === subject.id);
        return { subject, total: sessions.length, done, nextExam };
      }),
    [data.subjects, data.sessions, upcomingExams],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Studieomgeving</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            {todaySessions.length > 0
              ? `Vandaag ${todayDone} van ${todaySessions.length} studiesessies afgerond.`
              : 'Je overzicht van vandaag, je toetsen en je voortgang per vak.'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/planner')}>
          <CalendarClock className="h-4 w-4" />
          Naar de planner
        </Button>
      </div>

      <WeeklyGoalCard />

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard title="Vandaag" className="xl:col-span-2">
          {todaySessions.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Vandaag staat er niets gepland"
              description="Maak een planning in de studieplanner, dan zie je hier je studiesessies van de dag."
              action={
                <Button variant="secondary" size="sm" onClick={() => navigate('/planner')}>
                  Naar de planner
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {todaySessions.map((session) => {
                const subject = subjectById.get(session.subject_id);
                return (
                  <li key={session.id} className={cn('flex items-center gap-4 rounded-2xl p-3', session.completed && 'opacity-60')}>
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-outline',
                        session.completed ? 'bg-accent-600 text-white dark:bg-accent-500' : 'bg-panel dark:bg-neutral-800',
                      )}
                    >
                      {session.completed && <Check className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-medium text-neutral-900 dark:text-neutral-100', session.completed && 'line-through')}>
                        {subject?.name ?? 'Onbekend vak'}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {formatTime(session.start_time)} · {session.duration_minutes} min
                      </p>
                    </div>
                    <span className={cn('h-3 w-3 shrink-0 rounded-full', subject ? SUBJECT_COLORS[subject.color].dot : 'bg-neutral-400')} />
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Komende toetsen" action={{ label: 'Alle vakken', path: '/vakken' }}>
          {upcomingExams.length === 0 ? (
            <EmptyState icon={BookOpen} title="Geen toetsen gepland" description="Voeg een toets toe bij een vak." />
          ) : (
            <ul className="space-y-2">
              {upcomingExams.slice(0, 4).map((exam) => {
                const subject = subjectById.get(exam.subject_id);
                const days = daysUntil(exam.exam_date);
                return (
                  <li key={exam.id} className="flex items-center justify-between gap-3 rounded-2xl p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{subject?.name ?? 'Toets'}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{formatShortDate(exam.exam_date)}</p>
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

        <SectionCard title="Voortgang per vak" className="xl:col-span-3">
          {progressRows.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Nog geen vakken"
              description="Voeg je schoolvakken toe om hier je voortgang te volgen."
              action={
                <Button variant="secondary" size="sm" onClick={() => navigate('/vakken')}>
                  Naar vakken
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {progressRows.map(({ subject, total, done, nextExam }) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => navigate('/vakken')}
                  className="group rounded-playful border-[3px] border-outline bg-panel p-4 text-left shadow-hard-sm transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:bg-neutral-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn('h-3 w-3 rounded-full transition-transform duration-300 group-hover:scale-125', SUBJECT_COLORS[subject.color].dot)} />
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{subject.name}</span>
                  </div>
                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    {nextExam ? `Volgende toets ${formatRelativeDays(daysUntil(nextExam.exam_date)).toLowerCase()}` : 'Geen toets gepland'}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                      <span>Sessies afgerond</span>
                      <span>{total === 0 ? 'Geen sessies' : `${done} van ${total}`}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', SUBJECT_COLORS[subject.color].bar)}
                        style={{ width: total === 0 ? '0%' : `${(done / total) * 100}%` }}
                      />
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
