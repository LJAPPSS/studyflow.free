import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { SubjectDialog } from '@/components/subjects/SubjectDialog';
import { ExamDialog } from '@/components/subjects/ExamDialog';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS, RATING_LABELS } from '@/lib/constants';
import { daysUntil, formatRelativeDays, formatShortDate, formatTime } from '@/lib/format';
import { toUserMessage } from '@/lib/errors';
import { deleteExam, deleteSubject } from '@/services/subjects';
import type { Exam, Subject } from '@/types/study';

type PendingDelete = { kind: 'subject'; subject: Subject } | { kind: 'exam'; exam: Exam };

export function SubjectsPage() {
  const { data, refresh } = useStudyData();
  const { show } = useToast();
  const [subjectDialog, setSubjectDialog] = useState<{ open: boolean; subject?: Subject }>({ open: false });
  const [examDialog, setExamDialog] = useState<{ open: boolean; subjectId: string | null }>({ open: false, subjectId: null });
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const periodById = useMemo(() => new Map(data.examPeriods.map((period) => [period.id, period.name])), [data.examPeriods]);

  const examsBySubject = useMemo(() => {
    const map = new Map<string, Exam[]>();
    for (const exam of data.exams) {
      const list = map.get(exam.subject_id) ?? [];
      list.push(exam);
      map.set(exam.subject_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.exam_date.localeCompare(b.exam_date));
    return map;
  }, [data.exams]);

  const closeDelete = () => {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (pendingDelete.kind === 'exam') {
        await deleteExam(pendingDelete.exam.id);
        show('Examen verwijderd.');
      } else {
        const { subject } = pendingDelete;
        await deleteSubject(subject.id);
        show(`Vak "${subject.name}" verwijderd.`);
      }
      await refresh();
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(toUserMessage(err, 'Verwijderen is mislukt. Probeer het opnieuw.'));
    } finally {
      setDeleting(false);
    }
  };

  const subjectCount = data.subjects.length;
  const examCount = data.exams.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Mijn vakken</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {subjectCount} {subjectCount === 1 ? 'vak' : 'vakken'} · {examCount} {examCount === 1 ? 'examen' : 'examens'}
          </p>
        </div>
        <Button onClick={() => setSubjectDialog({ open: true })}>
          <Plus className="h-4 w-4" />
          Vak toevoegen
        </Button>
      </div>

      {subjectCount === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nog geen vakken"
          description="Voeg je schoolvakken toe. Je gebruikt ze in je planning en bij je examens."
          action={
            <Button onClick={() => setSubjectDialog({ open: true })}>
              <Plus className="h-4 w-4" />
              Eerste vak toevoegen
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-5 xl:grid-cols-2">
          {data.subjects.map((subject) => {
            const exams = examsBySubject.get(subject.id) ?? [];
            const upcoming = exams.filter((exam) => daysUntil(exam.exam_date) >= 0);
            const color = SUBJECT_COLORS[subject.color];
            return (
              <li key={subject.id} className="card card-interactive overflow-hidden p-0">
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span className={cn('mt-1.5 h-3 w-3 shrink-0 rounded-full', color.dot)} />
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-50">{subject.name}</h2>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium ring-1', color.soft)}>
                          Moeilijkheid {RATING_LABELS[subject.difficulty as 1 | 2 | 3 | 4 | 5]}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          Zelfvertrouwen {subject.confidence}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`${subject.name} bewerken`}
                      onClick={() => setSubjectDialog({ open: true, subject })}
                      className="rounded-xl p-2 text-neutral-500 transition-all hover:-translate-y-0.5 hover:bg-neutral-100 hover:text-neutral-900 active:scale-90 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${subject.name} verwijderen`}
                      onClick={() => setPendingDelete({ kind: 'subject', subject })}
                      className="rounded-xl p-2 text-neutral-500 transition-all hover:-translate-y-0.5 hover:bg-error-50 hover:text-error-600 active:scale-90 dark:hover:bg-error-600/15 dark:hover:text-error-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-neutral-100 bg-neutral-50/70 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <CalendarDays className="h-4 w-4 text-neutral-400" />
                      {upcoming.length === 0 ? 'Geen komende examens' : `${upcoming.length} komend${upcoming.length === 1 ? '' : 'e'} examen${upcoming.length === 1 ? '' : 's'}`}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setExamDialog({ open: true, subjectId: subject.id })}>
                      <Plus className="h-3.5 w-3.5" />
                      Examen
                    </Button>
                  </div>

                  {exams.length === 0 ? (
                    <p className="rounded-playful border-2 border-outline bg-panel px-4 py-3 text-sm text-neutral-700 shadow-hard-sm dark:bg-neutral-800/50 dark:text-neutral-300">
                      Nog geen examens ingepland voor dit vak.
                    </p>
                  ) : (
                    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {exams.map((exam) => {
                        const days = daysUntil(exam.exam_date);
                        const periodName = exam.exam_period_id ? periodById.get(exam.exam_period_id) : null;
                        return (
                          <li key={exam.id} className="flex items-center gap-3 py-3 transition-transform duration-200 hover:translate-x-1">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {exam.title || formatShortDate(exam.exam_date)}
                                {exam.title && <span className="font-normal text-neutral-500 dark:text-neutral-400"> · {formatShortDate(exam.exam_date)}</span>}
                              </p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                                {exam.start_time && (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(exam.start_time)}
                                  </span>
                                )}
                                {exam.duration_minutes && <span>{exam.duration_minutes} min</span>}
                                {periodName && <span>{periodName}</span>}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                                days < 0
                                  ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                                  : days <= 7
                                    ? 'bg-error-50 text-error-700 dark:bg-error-600/15 dark:text-error-300'
                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
                              )}
                            >
                              {days < 0 ? 'Afgelopen' : formatRelativeDays(days)}
                            </span>
                            <button
                              type="button"
                              aria-label="Examen verwijderen"
                              onClick={() => setPendingDelete({ kind: 'exam', exam })}
                              className="rounded-xl p-1.5 text-neutral-400 transition-all hover:bg-error-50 hover:text-error-600 active:scale-90 dark:hover:bg-error-600/15 dark:hover:text-error-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SubjectDialog open={subjectDialog.open} subject={subjectDialog.subject} onClose={() => setSubjectDialog({ open: false })} />
      <ExamDialog
        open={examDialog.open}
        presetSubjectId={examDialog.subjectId}
        onClose={() => setExamDialog({ open: false, subjectId: null })}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'subject' ? 'Vak verwijderen?' : 'Examen verwijderen?'}
        description={
          pendingDelete?.kind === 'subject'
            ? `"${pendingDelete.subject.name}" wordt verwijderd, samen met de bijbehorende examens. Dit kan niet ongedaan worden gemaakt.`
            : 'Dit examen wordt verwijderd uit je planning.'
        }
        confirmLabel="Verwijderen"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={closeDelete}
      />
      {deleteError && pendingDelete && (
        <p role="alert" className="sr-only">
          {deleteError}
        </p>
      )}
    </div>
  );
}
