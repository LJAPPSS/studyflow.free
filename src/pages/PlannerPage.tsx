import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, Check, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/constants';
import { toUserMessage } from '@/lib/errors';
import { formatShortDate, formatTime, formatWeekdayDate, todayIso } from '@/lib/format';
import { buildStudyPlan, minutesOfDay, SESSION_MINUTES } from '@/lib/studyPlanner';
import { navigate } from '@/lib/router';
import {
  deleteOpenStudySessionsFrom,
  deleteStudySession,
  insertStudySessions,
  setStudySessionCompleted,
  updateStudySession,
} from '@/services/studySessions';
import type { StudySession } from '@/types/study';

const inputClass =
  'w-full rounded-xl border-2 border-outline bg-panel px-3.5 py-2.5 text-ink outline-none transition focus:shadow-hard-sm dark:bg-neutral-800';

export function PlannerPage() {
  const { data, refresh } = useStudyData();
  const { show } = useToast();
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editing, setEditing] = useState<StudySession | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StudySession | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const today = todayIso();
  const subjectById = useMemo(() => new Map(data.subjects.map((subject) => [subject.id, subject])), [data.subjects]);
  const examById = useMemo(() => new Map(data.exams.map((exam) => [exam.id, exam])), [data.exams]);

  const upcoming = useMemo(
    () => data.sessions.filter((session) => session.session_date >= today),
    [data.sessions, today],
  );
  const groups = useMemo(() => {
    const byDate = new Map<string, StudySession[]>();
    for (const session of upcoming) {
      const list = byDate.get(session.session_date) ?? [];
      list.push(session);
      byDate.set(session.session_date, list);
    }
    return [...byDate.entries()];
  }, [upcoming]);

  const doneCount = upcoming.filter((session) => session.completed).length;
  const hasUpcomingExams = data.exams.some((exam) => exam.exam_date > today);
  const hasStudyTime = data.availability.some((block) => block.kind === 'studietijd');

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const plan = buildStudyPlan({
        today,
        nowMinutes: minutesOfDay(new Date()),
        subjects: data.subjects,
        exams: data.exams,
        availability: data.availability,
        sessions: data.sessions,
      });
      await deleteOpenStudySessionsFrom(today);
      await insertStudySessions(plan.sessions);
      await refresh();
      setRegenerateOpen(false);
      show(
        plan.sessions.length === 0
          ? 'Geen nieuwe sessies gepland. Controleer je studietijd en toetsen.'
          : `${plan.sessions.length} studiesessies ingepland.`,
      );
    } catch (err) {
      show(toUserMessage(err, 'De planning kon niet worden gemaakt.'), 'error');
    } finally {
      setRegenerating(false);
    }
  };

  const toggleCompleted = async (session: StudySession) => {
    setBusyId(session.id);
    try {
      await setStudySessionCompleted(session.id, !session.completed);
      await refresh();
    } catch (err) {
      show(toUserMessage(err, 'De sessie kon niet worden bijgewerkt.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteStudySession(pendingDelete.id);
      await refresh();
      show('Sessie verwijderd.');
      setPendingDelete(null);
    } catch (err) {
      show(toUserMessage(err, 'De sessie kon niet worden verwijderd.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderBody = () => {
    if (!hasUpcomingExams) {
      return (
        <EmptyState
          icon={CalendarClock}
          title="Nog geen toetsen gepland"
          description="Voeg een toets toe bij een vak. Dan kan de planner studiesessies vóór die datum inplannen."
          action={
            <Button size="sm" onClick={() => navigate('/vakken')}>
              Naar vakken
            </Button>
          }
        />
      );
    }
    if (!hasStudyTime) {
      return (
        <EmptyState
          icon={CalendarClock}
          title="Nog geen studietijd ingesteld"
          description="Geef aan wanneer je kunt studeren. De planner plant sessies in die tijdvakken."
          action={
            <Button size="sm" onClick={() => navigate('/instellingen/beschikbaarheid')}>
              Studietijd instellen
            </Button>
          }
        />
      );
    }
    if (upcoming.length === 0) {
      return (
        <EmptyState
          icon={CalendarClock}
          title="Nog geen sessies ingepland"
          description="Maak een planning op basis van je toetsen, moeilijkheid en zelfvertrouwen per vak."
          action={
            <Button size="sm" onClick={() => setRegenerateOpen(true)}>
              <RefreshCw className="h-4 w-4" />
              Planning maken
            </Button>
          }
        />
      );
    }
    return (
      <div className="space-y-6">
        {groups.map(([date, sessions]) => (
          <section key={date} className="card">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {date === today ? 'Vandaag' : formatWeekdayDate(date)}
            </h2>
            <ul className="space-y-2.5">
              {sessions.map((session) => {
                const subject = subjectById.get(session.subject_id);
                const exam = session.exam_id ? examById.get(session.exam_id) : undefined;
                const busy = busyId === session.id;
                return (
                  <li
                    key={session.id}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border-2 border-outline bg-panel p-3.5 transition-[opacity] duration-200 dark:bg-neutral-800',
                      session.completed && 'opacity-60',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void toggleCompleted(session)}
                      disabled={busy}
                      aria-label={session.completed ? 'Markeer als niet gedaan' : 'Markeer als gedaan'}
                      aria-pressed={session.completed}
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-outline transition-[transform,background-color] duration-[180ms] active:scale-90',
                        session.completed ? 'bg-accent-600 text-white dark:bg-accent-500' : 'bg-white hover:bg-selection dark:bg-neutral-900',
                      )}
                    >
                      {session.completed && <Check className="h-4 w-4" />}
                    </button>
                    <span className={cn('h-3 w-3 shrink-0 rounded-full', subject ? SUBJECT_COLORS[subject.color].dot : 'bg-neutral-400')} />
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-medium text-neutral-900 dark:text-neutral-100', session.completed && 'line-through')}>
                        {subject?.name ?? 'Onbekend vak'}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {formatTime(session.start_time)} · {session.duration_minutes} min
                        {exam && ` · Toets ${formatShortDate(exam.exam_date)}`}
                      </p>
                    </div>
                    {!session.completed && (
                      <button
                        type="button"
                        onClick={() => setEditing(session)}
                        aria-label="Sessie verplaatsen"
                        className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingDelete(session)}
                      aria-label="Sessie verwijderen"
                      className="rounded-lg p-2 text-neutral-500 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-600/15 dark:hover:text-error-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Studieplanner</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            {upcoming.length > 0
              ? `${doneCount} van ${upcoming.length} sessies gedaan.`
              : 'Plan je studiesessies automatisch vóór je toetsen.'}
          </p>
        </div>
        <Button onClick={() => setRegenerateOpen(true)} disabled={!hasUpcomingExams || !hasStudyTime}>
          <RefreshCw className="h-4 w-4" />
          Planning maken
        </Button>
      </div>

      {renderBody()}

      <RegenerateDialog
        open={regenerateOpen}
        loading={regenerating}
        hasOpenSessions={upcoming.some((session) => !session.completed)}
        onConfirm={regenerate}
        onClose={() => setRegenerateOpen(false)}
      />

      {editing && (
        <EditSessionDialog
          key={editing.id}
          session={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Sessie verwijderen?"
        description="Deze studiesessie wordt uit je planning gehaald."
        confirmLabel="Verwijderen"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function RegenerateDialog({
  open,
  loading,
  hasOpenSessions,
  onConfirm,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  hasOpenSessions: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Planning maken"
      description={`Elke sessie duurt ${SESSION_MINUTES} minuten en wordt ingepland in je studietijd vóór de toets van elk vak.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuleren
          </Button>
          <Button onClick={() => void onConfirm()} loading={loading}>
            Planning maken
          </Button>
        </>
      }
    >
      {hasOpenSessions && (
        <p className="flex gap-2.5 rounded-xl border-2 border-outline bg-neutral-100 p-3 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Je bestaande geplande sessies die nog niet zijn gedaan worden vervangen. Afgeronde sessies blijven staan.
        </p>
      )}
    </Modal>
  );
}

function EditSessionDialog({
  session,
  onClose,
  onSaved,
}: {
  session: StudySession;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { show } = useToast();
  const [date, setDate] = useState(session.session_date);
  const [time, setTime] = useState(session.start_time.slice(0, 5));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const save = async () => {
    if (!date || !time) {
      setFormError('Kies een datum en tijd.');
      return;
    }
    if (date < todayIso()) {
      setFormError('Kies een datum vanaf vandaag.');
      return;
    }
    setSaving(true);
    try {
      await updateStudySession(session.id, {
        session_date: date,
        start_time: `${time}:00`,
        duration_minutes: session.duration_minutes,
      });
      await onSaved();
    } catch (err) {
      show(toUserMessage(err, 'De sessie kon niet worden verplaatst.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Sessie verplaatsen"
      description={`Datum en starttijd van deze sessie (${session.duration_minutes} min).`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Annuleren
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            Opslaan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Datum</span>
          <input type="date" value={date} min={todayIso()} onChange={(event) => setDate(event.target.value)} className={inputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Starttijd</span>
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className={inputClass} />
        </label>
      </div>
      {formError && <p className="mt-3 text-sm text-error-600 dark:text-error-300">{formError}</p>}
    </Modal>
  );
}
