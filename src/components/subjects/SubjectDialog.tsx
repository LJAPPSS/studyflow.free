import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { useStudyData } from '@/contexts/StudyDataContext';
import { useToast } from '@/components/ui/Toast';
import { createSubject, updateSubject, type SubjectInput } from '@/services/subjects';
import { toUserMessage } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { RATING_LABELS, SUBJECT_COLOR_KEYS, SUBJECT_COLORS, pickSubjectColor, type SubjectColorKey } from '@/lib/constants';
import type { Subject } from '@/types/study';

type SubjectDialogProps = {
  open: boolean;
  onClose: () => void;
  subject?: Subject;
  onSaved?: (subjectId: string) => void;
};

type Rating = 1 | 2 | 3 | 4 | 5;
const RATINGS: Rating[] = [1, 2, 3, 4, 5];

function RatingPicker({ label, value, onChange, id }: { label: string; value: Rating; onChange: (value: Rating) => void; id: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span id={id} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{RATING_LABELS[value]}</span>
      </div>
      <div role="radiogroup" aria-labelledby={id} className="grid grid-cols-5 gap-2">
        {RATINGS.map((rating) => (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            onClick={() => onChange(rating)}
            className={cn(
              'h-10 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95',
              value === rating
                ? 'border-[3px] border-outline bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500'
                : 'border-[3px] border-outline bg-panel text-neutral-700 hover:bg-selection hover:shadow-hard-sm dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
            )}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SubjectDialog({ open, onClose, subject, onSaved }: SubjectDialogProps) {
  const { data, refresh } = useStudyData();
  const { show } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState<SubjectColorKey>('blue');
  const [colorTouched, setColorTouched] = useState(false);
  const [difficulty, setDifficulty] = useState<Rating>(3);
  const [confidence, setConfidence] = useState<Rating>(3);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(subject?.name ?? '');
    setColor(subject?.color ?? 'blue');
    setColorTouched(Boolean(subject));
    setDifficulty((subject?.difficulty ?? 3) as Rating);
    setConfidence((subject?.confidence ?? 3) as Rating);
    setError(null);
  }, [open, subject]);

  const otherSubjects = data.subjects.filter((item) => item.id !== subject?.id);
  const usedColors = otherSubjects.map((item) => item.color);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!subject && !colorTouched) setColor(pickSubjectColor(value, usedColors));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Geef het vak een naam.');
      return;
    }
    if (trimmed.length > 80) {
      setError('De naam van het vak is te lang (maximaal 80 tekens).');
      return;
    }
    if (otherSubjects.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Je hebt al een vak met deze naam.');
      return;
    }

    const input: SubjectInput = { name: trimmed, color, difficulty, confidence };
    setSaving(true);
    setError(null);
    try {
      if (subject) {
        await updateSubject(subject.id, input);
        await refresh();
        show('Vak bijgewerkt.');
        onClose();
      } else {
        const subjectId = await createSubject(input);
        await refresh();
        show(`Vak "${trimmed}" toegevoegd.`);
        onSaved?.(subjectId);
        onClose();
      }
    } catch (err) {
      setError(toUserMessage(err, 'Het vak kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={subject ? 'Vak bewerken' : 'Nieuw vak toevoegen'}
      description="Moeilijkheid en zelfvertrouwen helpen straks bij het verdelen van je studietijd."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Annuleren
          </Button>
          <Button type="submit" form="subject-form" loading={saving}>
            {subject ? 'Wijzigingen opslaan' : 'Vak toevoegen'}
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Field label="Naam van het vak" htmlFor="subject-name" error={error}>
          <input
            id="subject-name"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="bv. Wiskunde"
            maxLength={80}
            className={inputClass}
            autoFocus
          />
        </Field>

        <div className="space-y-2">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Kleur</span>
          <div className="flex flex-wrap gap-2.5">
            {SUBJECT_COLOR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                title={SUBJECT_COLORS[key].label}
                aria-label={`Kleur ${SUBJECT_COLORS[key].label}`}
                aria-pressed={color === key}
                onClick={() => {
                  setColor(key);
                  setColorTouched(true);
                }}
                className={cn(
                  'h-8 w-8 rounded-full ring-offset-2 ring-offset-white transition duration-150 hover:scale-110 dark:ring-offset-neutral-900',
                  SUBJECT_COLORS[key].dot,
                  color === key ? 'ring-2 ring-neutral-900 dark:ring-neutral-100' : 'ring-0',
                )}
              />
            ))}
          </div>
        </div>

        <RatingPicker id="subject-difficulty" label="Moeilijkheidsgraad" value={difficulty} onChange={setDifficulty} />
        <RatingPicker id="subject-confidence" label="Zelfvertrouwen" value={confidence} onChange={setConfidence} />
      </form>
    </Modal>
  );
}
