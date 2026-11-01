import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Calendar, Menu, Search, type LucideIcon } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { navigate } from '@/lib/router';
import { formatShortDate, formatTime } from '@/lib/format';
import { SUBJECT_COLORS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Exam, Subject } from '@/types/study';

type SearchResult = {
  key: string;
  group: 'Vakken' | 'Examens';
  title: string;
  subtitle: string;
  color?: Subject['color'];
  icon: LucideIcon;
  path: string;
};

const MAX_RESULTS_PER_GROUP = 6;

function matches(value: string, query: string): boolean {
  return value.toLowerCase().includes(query);
}

function buildResults(query: string, subjects: Subject[], exams: Exam[]): SearchResult[] {
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const results: SearchResult[] = [];

  subjects
    .filter((subject) => matches(subject.name, query))
    .slice(0, MAX_RESULTS_PER_GROUP)
    .forEach((subject) =>
      results.push({
        key: `subject-${subject.id}`,
        group: 'Vakken',
        title: subject.name,
        subtitle: `Moeilijkheid ${subject.difficulty}/5 · Zelfvertrouwen ${subject.confidence}/5`,
        color: subject.color,
        icon: BookOpen,
        path: '/vakken',
      }),
    );

  exams
    .filter((exam) => {
      const subjectName = subjectById.get(exam.subject_id)?.name ?? '';
      return matches(subjectName, query) || (exam.title !== null && matches(exam.title, query));
    })
    .slice(0, MAX_RESULTS_PER_GROUP)
    .forEach((exam) => {
      const subject = subjectById.get(exam.subject_id);
      results.push({
        key: `exam-${exam.id}`,
        group: 'Examens',
        title: subject?.name ?? 'Examen',
        subtitle: `${formatShortDate(exam.exam_date)}${exam.start_time ? ` om ${formatTime(exam.start_time)}` : ''}`,
        color: subject?.color,
        icon: Calendar,
        path: '/vakken',
      });
    });

  return results;
}

export function GlobalSearch() {
  const { data } = useStudyData();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized = query.trim().toLowerCase();
  const results = useMemo(
    () => (normalized.length >= 2 ? buildResults(normalized, data.subjects, data.exams) : []),
    [normalized, data],
  );

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    window.addEventListener('keydown', handleShortcut);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(result.path);
  };

  const showPanel = open && normalized.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'Enter' && results[0]) handleSelect(results[0]);
        }}
        placeholder="Zoek in vakken en examens..."
        aria-label="Zoeken"
        className="h-10 w-full rounded-xl border-[3px] border-outline bg-panel pl-10 pr-16 text-sm text-ink placeholder:text-neutral-500 transition-[box-shadow,background-color] duration-[180ms] focus:border-accent-600 focus:shadow-[3px_3px_0_var(--dp-color-accent)] focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-400 sm:block dark:border-neutral-700">
        Ctrl K
      </kbd>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-playful border-[3px] border-outline bg-panel p-2 shadow-hard animate-scale-in scrollbar-thin">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">Geen resultaten voor "{query.trim()}".</p>
          ) : (
            (['Vakken', 'Examens'] as const).map((group) => {
              const groupResults = results.filter((result) => result.group === group);
              if (groupResults.length === 0) return null;
              return (
                <div key={group} className="mb-1 last:mb-0">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{group}</p>
                  {groupResults.map((result) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.key}
                        type="button"
                        onClick={() => handleSelect(result)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-neutral-100 dark:hover:bg-neutral-800',
                        )}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {result.color && <span className={cn('h-2 w-2 shrink-0 rounded-full', SUBJECT_COLORS[result.color].dot)} />}
                            <span className="truncate">{result.title}</span>
                          </span>
                          <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">{result.subtitle}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Menu openen"
      className="rounded-xl p-2 text-neutral-600 transition hover:bg-neutral-100 lg:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
