import { useEffect, useState } from 'react';
import { Coffee, Pause, Play, RotateCcw, SkipForward, Timer } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/constants';
import { toUserMessage } from '@/lib/errors';
import { todayIso } from '@/lib/format';
import { insertFocusSession } from '@/services/focusSessions';
import { inputClass } from '@/components/ui/Field';

type Phase = 'focus' | 'break';

const FOCUS_OPTIONS = [25, 50] as const;
type FocusMinutes = (typeof FOCUS_OPTIONS)[number];

const breakMinutesFor = (focusMinutes: FocusMinutes) => (focusMinutes === 50 ? 10 : 5);

const RING_RADIUS = 120;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function FocusPage() {
  const { data, refresh } = useStudyData();
  const { show } = useToast();
  const [focusMinutes, setFocusMinutes] = useState<FocusMinutes>(25);
  const [phase, setPhase] = useState<Phase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [subjectId, setSubjectId] = useState('');

  const phaseSeconds = phase === 'focus' ? focusMinutes * 60 : breakMinutesFor(focusMinutes) * 60;
  const progress = secondsLeft / phaseSeconds;
  const selectedSubject = data.subjects.find((subject) => subject.id === subjectId);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    if (phase === 'focus') {
      setCompletedSessions((count) => count + 1);
      insertFocusSession({ subject_id: subjectId || null, session_date: todayIso(), duration_minutes: focusMinutes })
        .then(refresh)
        .catch((err: unknown) => show(toUserMessage(err, 'Je focusblok kon niet worden opgeslagen.'), 'error'));
      setPhase('break');
      setSecondsLeft(breakMinutesFor(focusMinutes) * 60);
      show('Focusblok klaar. Neem even pauze.');
    } else {
      setPhase('focus');
      setSecondsLeft(focusMinutes * 60);
      show('Pauze voorbij. Tijd voor een nieuw focusblok.');
    }
    setRunning(false);
  }, [secondsLeft, running, phase, focusMinutes, show, subjectId, refresh]);

  const resetPhase = (nextPhase: Phase, nextFocusMinutes: FocusMinutes = focusMinutes) => {
    setRunning(false);
    setPhase(nextPhase);
    setSecondsLeft(nextPhase === 'focus' ? nextFocusMinutes * 60 : breakMinutesFor(nextFocusMinutes) * 60);
  };

  const chooseFocusLength = (minutes: FocusMinutes) => {
    setFocusMinutes(minutes);
    resetPhase('focus', minutes);
  };

  const skip = () => {
    if (phase === 'focus') {
      resetPhase('break');
    } else {
      resetPhase('focus');
    }
  };

  const ringOffset = RING_CIRCUMFERENCE * (1 - progress);
  const isBreak = phase === 'break';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Focus-timer</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">Werk in korte blokken met vaste pauzes om gefocust te blijven.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card flex flex-col items-center gap-8 lg:col-span-2 sm:!p-10">
          <div className="flex flex-wrap items-center justify-center gap-2" role="radiogroup" aria-label="Lengte van een focusblok">
            {FOCUS_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                role="radio"
                aria-checked={focusMinutes === minutes}
                onClick={() => chooseFocusLength(minutes)}
                className={cn(
                  'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-[transform,background-color] duration-[180ms] active:scale-95',
                  focusMinutes === minutes
                    ? 'border-outline bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500'
                    : 'border-transparent bg-neutral-100 text-neutral-700 hover:border-outline dark:bg-neutral-800 dark:text-neutral-300',
                )}
              >
                {minutes} minuten
              </button>
            ))}
          </div>

          <div className="relative flex h-[280px] w-[280px] items-center justify-center">
            <svg viewBox="0 0 280 280" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="140" cy="140" r={RING_RADIUS} fill="none" strokeWidth="14" className="stroke-neutral-200 dark:stroke-neutral-700" />
              <circle
                cx="140"
                cy="140"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                className={cn('transition-[stroke-dashoffset] duration-1000 ease-linear', isBreak ? 'stroke-success-500' : 'stroke-accent-600')}
              />
            </svg>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                {isBreak ? 'Pauze' : 'Focus'}
              </p>
              <p className="mt-1 font-mono text-6xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50" aria-live="off">
                {formatClock(secondsLeft)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="md" onClick={() => setRunning((value) => !value)}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? 'Pauzeren' : 'Start'}
            </Button>
            <Button variant="secondary" size="md" onClick={skip}>
              <SkipForward className="h-4 w-4" />
              Overslaan
            </Button>
            <Button variant="secondary" size="md" onClick={() => resetPhase('focus')} aria-label="Timer resetten">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="card">
            <div className="flex items-center gap-2.5">
              <Timer className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Waar werk je aan?</h2>
            </div>
            <label htmlFor="focus-subject" className="sr-only">
              Vak
            </label>
            <select id="focus-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={cn(inputClass, 'mt-4')}>
              <option value="">Geen specifiek vak</option>
              {data.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {selectedSubject && (
              <div className="mt-4 flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
                <span className={cn('h-3 w-3 rounded-full', SUBJECT_COLORS[selectedSubject.color].dot)} />
                Je focust nu op {selectedSubject.name}
              </div>
            )}
          </section>

          <section className="card">
            <div className="flex items-center gap-2.5">
              <Coffee className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Deze sessie</h2>
            </div>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{completedSessions}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {completedSessions === 1 ? 'focusblok afgerond' : 'focusblokken afgerond'}
            </p>
            <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
              Na een focusblok van {focusMinutes} minuten volgt een pauze van {breakMinutesFor(focusMinutes)} minuten.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
