import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { useStudyData } from '@/contexts/StudyDataContext';
import { useToast } from '@/components/ui/Toast';
import { createExam } from '@/services/subjects';
import { toUserMessage } from '@/lib/errors';
import { todayIso } from '@/lib/format';

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 150, 180];
const DEFAULT_DURATION = 90;

type ExamDialogProps = {
  open: boolean;
  onClose: () => void;
  presetSubjectId?: string | null;
  onSaved?: () => void;
};

export function ExamDialog({ open, onClose, presetSubjectId = null, onSaved }: ExamDialogProps) {
  const { data, currentPeriods, refresh } = useStudyData();
  const { show } = useToast();
  const [subjectId, setSubjectId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubjectId(presetSubjectId ?? data.subjects[0]?.id ?? '');
    setPeriodId('');
    setExamDate('');
    setStartTime('');
    setDuration(DEFAULT_DURATION);
    setTitle('');
    setError(null);
  }, [open, presetSubjectId, data.subjects]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subjectId) {
      setError('Kies eerst een vak. Voeg anders eerst een vak toe.');
      return;
    }
    if (!examDate) {
      setError('Kies de datum van het examen.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createExam({
        subject_id: subjectId,
        exam_period_id: periodId || null,
        exam_date: examDate,
        start_time: startTime || null,
        duration_minutes: duration,
        title: title.trim() || null,
      });
      await refresh();
      show('Examen toegevoegd.');
      onSaved?.();
      onClose();
    } catch (err) {
      setError(toUserMessage(err, 'Het examen kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  const noSubjects = data.subjects.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Examen toevoegen"
      description="Vul de datum en het uur in. Je kunt zoveel examens toevoegen als je wilt."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Annuleren
          </Button>
          <Button type="submit" form="exam-form" loading={saving} disabled={noSubjects}>
            Examen opslaan
          </Button>
        </>
      }
    >
      <form id="exam-form" onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
        {noSubjects ? (
          <p className="sm:col-span-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            Voeg eerst een vak toe voordat je een examen inplant.
          </p>
        ) : (
          <>
            <Field label="Vak" htmlFor="exam-subject" className="sm:col-span-2">
              <select id="exam-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={inputClass}>
                {data.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Datum" htmlFor="exam-date">
              <input id="exam-date" type="date" min={todayIso()} value={examDate} onChange={(event) => setExamDate(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Examenuur" htmlFor="exam-time" hint="Optioneel">
              <input id="exam-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Duur" htmlFor="exam-duration">
              <select id="exam-duration" value={duration} onChange={(event) => setDuration(Number(event.target.value))} className={inputClass}>
                {DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minuten
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Examenperiode" htmlFor="exam-period" hint="Optioneel">
              <select id="exam-period" value={periodId} onChange={(event) => setPeriodId(event.target.value)} className={inputClass}>
                <option value="">Geen periode</option>
                {currentPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Titel" htmlFor="exam-title" hint="Optioneel, bv. Hoofdstuk 1 t/m 4" className="sm:col-span-2">
              <input id="exam-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className={inputClass} />
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
