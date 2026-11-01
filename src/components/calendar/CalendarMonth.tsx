import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/constants';
import { availabilityForDate, buildMonthGrid, weekdayIndex, type CalendarCell } from '@/lib/calendar';
import type { AvailabilityBlock, Exam, Subject } from '@/types/study';

const WEEKDAY_HEADERS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const MAX_CHIPS = 2;

type CalendarMonthProps = {
  month: Date;
  todayIso: string;
  selectedIso: string;
  examsByDate: Map<string, Exam[]>;
  subjects: Map<string, Subject>;
  availability: AvailabilityBlock[];
  onSelect: (iso: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function CalendarMonth({
  month,
  todayIso,
  selectedIso,
  examsByDate,
  subjects,
  availability,
  onSelect,
  onPrevious,
  onNext,
  onToday,
}: CalendarMonthProps) {
  const cells = buildMonthGrid(month, todayIso);
  const monthLabel = month.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  return (
    <section className="card p-5 sm:p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold capitalize text-neutral-900 dark:text-neutral-100">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Vandaag
          </button>
          <button
            type="button"
            onClick={onPrevious}
            aria-label="Vorige maand"
            className="grid h-9 w-9 place-items-center rounded-lg text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Volgende maand"
            className="grid h-9 w-9 place-items-center rounded-lg text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-px pb-2 text-center text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800">
        {cells.map((cell) => (
          <DayCell
            key={cell.iso}
            cell={cell}
            selected={cell.iso === selectedIso}
            exams={examsByDate.get(cell.iso) ?? []}
            subjects={subjects}
            hasAvailability={availabilityForDate(cell.iso, availability).length > 0}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

type DayCellProps = {
  cell: CalendarCell;
  selected: boolean;
  exams: Exam[];
  subjects: Map<string, Subject>;
  hasAvailability: boolean;
  onSelect: (iso: string) => void;
};

function DayCell({ cell, selected, exams, subjects, hasAvailability, onSelect }: DayCellProps) {
  const extra = exams.length - MAX_CHIPS;
  const isWeekend = weekdayIndex(new Date(`${cell.iso}T00:00:00`)) >= 5;

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.iso)}
      aria-pressed={selected}
      className={cn(
        'flex min-h-[4.5rem] flex-col gap-1 bg-white p-1.5 text-left transition duration-150 hover:bg-neutral-50 sm:min-h-[6.5rem] sm:p-2 dark:bg-neutral-900 dark:hover:bg-neutral-800/70',
        !cell.inMonth && 'text-neutral-400 dark:text-neutral-600',
        cell.inMonth && isWeekend && 'bg-neutral-50/70 dark:bg-neutral-900/60',
        selected && 'ring-2 ring-inset ring-accent-500',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'grid h-7 w-7 place-items-center rounded-full text-sm font-medium',
            cell.isToday ? 'bg-accent-600 text-white' : cell.inMonth ? 'text-neutral-800 dark:text-neutral-100' : '',
          )}
        >
          {cell.day}
        </span>
        {hasAvailability && <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" aria-label="Beschikbaarheid" />}
      </div>

      <div className="flex flex-col gap-0.5">
        {exams.slice(0, MAX_CHIPS).map((exam) => {
          const subject = subjects.get(exam.subject_id);
          const color = subject ? SUBJECT_COLORS[subject.color] : null;
          return (
            <span key={exam.id} className="flex items-center gap-1 truncate text-[11px] font-medium text-neutral-700 dark:text-neutral-200">
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', color?.dot ?? 'bg-neutral-400')} />
              <span className="truncate">{subject?.name ?? 'Examen'}</span>
            </span>
          );
        })}
        {extra > 0 && <span className="text-[11px] text-neutral-500 dark:text-neutral-400">+{extra} meer</span>}
      </div>
    </button>
  );
}
