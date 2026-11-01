import { CalendarCheck, Clock, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { availabilityForDate } from '@/lib/calendar';
import { SUBJECT_COLORS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { formatRelativeDays, formatTime, formatWeekdayDate, daysUntil } from '@/lib/format';
import type { AvailabilityBlock, Exam, ExamPeriod, Subject } from '@/types/study';

type DayAgendaProps = {
  iso: string;
  exams: Exam[];
  subjects: Map<string, Subject>;
  periods: Map<string, ExamPeriod>;
  availability: AvailabilityBlock[];
};

export function DayAgenda({ iso, exams, subjects, periods, availability }: DayAgendaProps) {
  const blocks = availabilityForDate(iso, availability);
  const isEmpty = exams.length === 0 && blocks.length === 0;

  return (
    <aside className="card flex flex-col gap-5 p-5 sm:p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {formatRelativeDays(daysUntil(iso))}
        </p>
        <h2 className="mt-1 text-lg font-semibold capitalize text-neutral-900 dark:text-neutral-100">{formatWeekdayDate(iso)}</h2>
      </div>

      {isEmpty ? (
        <EmptyState icon={CalendarCheck} title="Niets gepland" description="Er staan geen examens of vaste tijden op deze dag." />
      ) : (
        <div className="space-y-6">
          {exams.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Examens</h3>
              {exams.map((exam) => {
                const subject = subjects.get(exam.subject_id);
                const period = exam.exam_period_id ? periods.get(exam.exam_period_id) : undefined;
                const color = subject ? SUBJECT_COLORS[subject.color] : null;
                return (
                  <article key={exam.id} className="flex gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', color?.dot ?? 'bg-neutral-400')} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{exam.title || subject?.name || 'Examen'}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {exam.start_time && (
                          <>
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatTime(exam.start_time)}
                            {exam.duration_minutes ? ` · ${exam.duration_minutes} min` : ''}
                          </>
                        )}
                        {!exam.start_time && period?.name}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {blocks.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Vaste tijden</h3>
              {blocks.map((block) => (
                <article key={block.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
                  {block.kind === 'studietijd' ? (
                    <Sparkles className="h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
                  ) : (
                    <Clock className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {block.label || (block.kind === 'studietijd' ? 'Studietijd' : 'Verplichting')}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatTime(block.start_time)} - {formatTime(block.end_time)}
                    </p>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      )}
    </aside>
  );
}
