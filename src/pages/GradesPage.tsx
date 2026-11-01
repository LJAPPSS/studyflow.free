import { useMemo, useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { GradeDialog } from '@/components/grades/GradeDialog';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/constants';
import { formatDecimal, formatShortDate } from '@/lib/format';
import { toUserMessage } from '@/lib/errors';
import { deleteGrade } from '@/services/grades';
import type { Grade } from '@/types/study';

function weightedAverage(grades: Grade[]): number | null {
  const totalWeight = grades.reduce((sum, grade) => sum + grade.weight, 0);
  if (totalWeight === 0) return null;
  return grades.reduce((sum, grade) => sum + grade.grade * grade.weight, 0) / totalWeight;
}

export function GradesPage() {
  const { data, refresh } = useStudyData();
  const { show } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Grade | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const gradesBySubject = useMemo(() => {
    const map = new Map<string, Grade[]>();
    for (const grade of data.grades) {
      const list = map.get(grade.subject_id) ?? [];
      list.push(grade);
      map.set(grade.subject_id, list);
    }
    return map;
  }, [data.grades]);

  const overallAverage = weightedAverage(data.grades);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteGrade(pendingDelete.id);
      await refresh();
      show('Cijfer verwijderd.');
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(toUserMessage(err, 'Verwijderen is mislukt. Probeer het opnieuw.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Cijfers</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {overallAverage === null
              ? 'Nog geen cijfers ingevoerd.'
              : `Gewogen gemiddelde over alle vakken: ${formatDecimal(overallAverage)}`}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={data.subjects.length === 0}>
          <Plus className="h-4 w-4" />
          Cijfer toevoegen
        </Button>
      </div>

      {data.subjects.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nog geen vakken" description="Voeg eerst een vak toe, dan kun je cijfers invoeren." />
      ) : data.grades.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nog geen cijfers"
          description="Voeg je eerste cijfer toe. Je ziet dan per vak het gewogen gemiddelde."
        />
      ) : (
        <ul className="grid gap-5 xl:grid-cols-2">
          {data.subjects.map((subject) => {
            const grades = gradesBySubject.get(subject.id) ?? [];
            if (grades.length === 0) return null;
            const average = weightedAverage(grades);
            const color = SUBJECT_COLORS[subject.color];
            return (
              <li key={subject.id} className="card overflow-hidden p-0">
                <div className="flex items-center justify-between gap-4 border-b border-neutral-100 p-5 dark:border-neutral-800">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={cn('h-3 w-3 shrink-0 rounded-full', color.dot)} />
                    <h2 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-50">{subject.name}</h2>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">Gemiddelde</span>
                    <span className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                      {average === null ? '-' : formatDecimal(average)}
                    </span>
                  </p>
                </div>
                <ul className="divide-y divide-neutral-100 px-5 dark:divide-neutral-800">
                  {grades.map((grade) => (
                    <li key={grade.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {grade.title || 'Cijfer'}
                          <span className="font-normal text-neutral-500 dark:text-neutral-400"> · {formatShortDate(grade.grade_date)}</span>
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Gewicht {grade.weight}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-sm font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
                        {formatDecimal(grade.grade)}
                      </span>
                      <button
                        type="button"
                        aria-label="Cijfer verwijderen"
                        onClick={() => setPendingDelete(grade)}
                        className="rounded-xl p-1.5 text-neutral-400 transition-all hover:bg-error-50 hover:text-error-600 active:scale-90 dark:hover:bg-error-600/15 dark:hover:text-error-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      <GradeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Cijfer verwijderen?"
        description="Dit cijfer wordt verwijderd uit het gemiddelde van het vak."
        confirmLabel="Verwijderen"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          if (deleting) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
      {deleteError && pendingDelete && (
        <p role="alert" className="sr-only">
          {deleteError}
        </p>
      )}
    </div>
  );
}
