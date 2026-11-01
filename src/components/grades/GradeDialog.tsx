import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { useStudyData } from '@/contexts/StudyDataContext';
import { useToast } from '@/components/ui/Toast';
import { insertGrade } from '@/services/grades';
import { toUserMessage } from '@/lib/errors';
import { todayIso } from '@/lib/format';

const WEIGHT_OPTIONS = [1, 2, 3, 4];

type GradeDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function GradeDialog({ open, onClose }: GradeDialogProps) {
  const { data, refresh } = useStudyData();
  const { show } = useToast();
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [weight, setWeight] = useState(1);
  const [gradeDate, setGradeDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubjectId(data.subjects[0]?.id ?? '');
    setTitle('');
    setGrade('');
    setWeight(1);
    setGradeDate(todayIso());
    setError(null);
  }, [open, data.subjects]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(grade.replace(',', '.'));
    if (!subjectId) {
      setError('Kies eerst een vak.');
      return;
    }
    if (!Number.isFinite(value) || value < 1 || value > 10) {
      setError('Vul een cijfer in tussen 1 en 10.');
      return;
    }
    if (!gradeDate) {
      setError('Kies de datum van het cijfer.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await insertGrade({
        subject_id: subjectId,
        title: title.trim() || null,
        grade: Math.round(value * 10) / 10,
        weight,
        grade_date: gradeDate,
      });
      await refresh();
      show('Cijfer toegevoegd.');
      onClose();
    } catch (err) {
      setError(toUserMessage(err, 'Het cijfer kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  const noSubjects = data.subjects.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cijfer toevoegen"
      description="Voeg een resultaat toe. Het gewicht bepaalt hoe zwaar het meetelt in het gemiddelde."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Annuleren
          </Button>
          <Button type="submit" form="grade-form" loading={saving} disabled={noSubjects}>
            Cijfer opslaan
          </Button>
        </>
      }
    >
      <form id="grade-form" onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
        {noSubjects ? (
          <p className="sm:col-span-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            Voeg eerst een vak toe voordat je een cijfer invoert.
          </p>
        ) : (
          <>
            <Field label="Vak" htmlFor="grade-subject" className="sm:col-span-2">
              <select id="grade-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={inputClass}>
                {data.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cijfer (1 tot 10)" htmlFor="grade-value">
              <input
                id="grade-value"
                inputMode="decimal"
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                placeholder="bv. 7,5"
                className={inputClass}
              />
            </Field>
            <Field label="Gewicht" htmlFor="grade-weight" hint="1 is normaal, hoger telt zwaarder">
              <select id="grade-weight" value={weight} onChange={(event) => setWeight(Number(event.target.value))} className={inputClass}>
                {WEIGHT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Datum" htmlFor="grade-date">
              <input id="grade-date" type="date" value={gradeDate} onChange={(event) => setGradeDate(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Omschrijving" htmlFor="grade-title" hint="Optioneel, bv. Toets hoofdstuk 3" className="sm:col-span-2">
              <input id="grade-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className={inputClass} />
            </Field>
            {error && (
              <p role="alert" className="text-sm text-error-600 sm:col-span-2 dark:text-error-300">
                {error}
              </p>
            )}
          </>
        )}
      </form>
    </Modal>
  );
}
