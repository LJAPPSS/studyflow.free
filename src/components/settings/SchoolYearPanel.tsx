import { useState, type FormEvent } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field, inputClass } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { toUserMessage } from '@/lib/errors';
import { createExamPeriod, deleteExamPeriod, renameExamPeriod, renameSchoolYear } from '@/services/schoolYears';
import type { ExamPeriod } from '@/types/study';

export function SchoolYearPanel() {
  const { data, currentSchoolYear, currentPeriods, refresh } = useStudyData();
  const { show } = useToast();
  const [label, setLabel] = useState(currentSchoolYear?.label ?? '');
  const [newPeriodName, setNewPeriodName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<ExamPeriod | null>(null);

  if (!currentSchoolYear) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nog geen schooljaar"
        description="Stel eerst je studieomgeving in. Daarna kun je hier je schooljaar en examenperiodes beheren."
      />
    );
  }


  const handleRenameYear = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) {
      setError('Vul een schooljaar in, bv. 2025-2026.');
      return;
    }
    if (trimmed === currentSchoolYear.label) return;
    if (data.schoolYears.some((year) => year.id !== currentSchoolYear.id && year.label === trimmed)) {
      setError('Dit schooljaar bestaat al.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await renameSchoolYear(currentSchoolYear.id, trimmed);
      await refresh();
      show('Schooljaar bijgewerkt.');
    } catch (err) {
      setError(toUserMessage(err, 'Het schooljaar kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  const handleRenamePeriod = async (period: ExamPeriod, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === period.name) return;
    if (currentPeriods.some((item) => item.id !== period.id && item.name.toLowerCase() === trimmed.toLowerCase())) {
      show('Deze examenperiode bestaat al.', 'error');
      return;
    }
    try {
      await renameExamPeriod(period.id, trimmed);
      await refresh();
      show('Examenperiode hernoemd.');
    } catch (err) {
      show(toUserMessage(err, 'De examenperiode kon niet worden hernoemd.'), 'error');
    }
  };

  const handleAddPeriod = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newPeriodName.trim();
    if (!trimmed) return;
    if (currentPeriods.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Deze examenperiode bestaat al.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createExamPeriod(currentSchoolYear.id, trimmed);
      await refresh();
      setNewPeriodName('');
      show('Examenperiode toegevoegd.');
    } catch (err) {
      setError(toUserMessage(err, 'De examenperiode kon niet worden toegevoegd.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePeriod = async () => {
    if (!periodToDelete) return;
    setSaving(true);
    try {
      await deleteExamPeriod(periodToDelete);
      await refresh();
      show('Examenperiode verwijderd.');
      setPeriodToDelete(null);
    } catch (err) {
      show(toUserMessage(err, 'De examenperiode kon niet worden verwijderd.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card sm:!p-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Schooljaar</h2>
        <p className="mt-1 mb-6 text-sm text-neutral-500 dark:text-neutral-400">De naam wordt gebruikt als naam van je schooljaar in de app.</p>
        <form onSubmit={handleRenameYear} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
          <div className="flex-1">
            <Field label="Naam schooljaar" htmlFor="school-year-label" error={error}>
              <input id="school-year-label" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={20} className={inputClass} />
            </Field>
          </div>
          <div className="sm:pt-7">
            <Button type="submit" loading={saving}>
              Opslaan
            </Button>
          </div>
        </form>
      </section>

      <section className="card sm:!p-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Examenperiodes</h2>
        <p className="mt-1 mb-6 text-sm text-neutral-500 dark:text-neutral-400">Pas de naam aan door hem te wijzigen en Enter te drukken.</p>

        {currentPeriods.length === 0 ? (
          <p className="mb-6 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">Nog geen examenperiodes voor dit schooljaar.</p>
        ) : (
          <ul className="mb-6 divide-y divide-neutral-100 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {currentPeriods.map((period) => (
              <PeriodRow key={period.id} period={period} onRename={(name) => handleRenamePeriod(period, name)} onDelete={() => setPeriodToDelete(period)} />
            ))}
          </ul>
        )}

        <form onSubmit={handleAddPeriod} className="flex gap-2">
          <input
            value={newPeriodName}
            onChange={(event) => setNewPeriodName(event.target.value)}
            placeholder="Nieuwe periode, bv. Herkansingen"
            aria-label="Naam van een nieuwe examenperiode"
            maxLength={60}
            className={inputClass}
          />
          <Button type="submit" variant="secondary" disabled={!newPeriodName.trim()} loading={saving} className="shrink-0">
            <Plus className="h-4 w-4" />
            Toevoegen
          </Button>
        </form>
      </section>

      <ConfirmDialog
        open={periodToDelete !== null}
        title="Examenperiode verwijderen?"
        description={
          periodToDelete
            ? `"${periodToDelete.name}" wordt verwijderd. Examens in deze periode blijven bestaan maar krijgen geen periode meer.`
            : ''
        }
        confirmLabel="Verwijderen"
        loading={saving}
        onConfirm={confirmDeletePeriod}
        onClose={() => setPeriodToDelete(null)}
      />
    </div>
  );
}

function PeriodRow({ period, onRename, onDelete }: { period: ExamPeriod; onRename: (name: string) => void; onDelete: () => void }) {
  const [value, setValue] = useState(period.name);

  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => onRename(value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') setValue(period.name);
        }}
        aria-label={`Naam van ${period.name}`}
        maxLength={60}
        className={cn('min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-neutral-900 transition hover:border-outline focus:border-accent-600 focus:bg-panel focus:shadow-[3px_3px_0_var(--dp-color-accent)] focus:outline-none dark:text-neutral-100 dark:hover:border-neutral-600 dark:focus:bg-neutral-900')}
      />
      <button
        type="button"
        aria-label={`${period.name} verwijderen`}
        onClick={onDelete}
        className="rounded-lg p-2 text-neutral-500 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-600/15 dark:hover:text-error-300"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
