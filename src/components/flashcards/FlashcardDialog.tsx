import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { toUserMessage } from '@/lib/errors';
import { createFlashcard, updateFlashcard } from '@/services/flashcards';
import type { Flashcard, Subject } from '@/types/study';

type FlashcardDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  subjects: Subject[];
  card: Flashcard | null;
  defaultSubjectId: string | null;
};

const textareaClass = `${inputClass} min-h-[96px] resize-y`;

export function FlashcardDialog({ open, onClose, onSaved, subjects, card, defaultSubjectId }: FlashcardDialogProps) {
  if (!open) return null;
  return (
    <FlashcardForm
      key={card?.id ?? 'new'}
      onClose={onClose}
      onSaved={onSaved}
      subjects={subjects}
      card={card}
      defaultSubjectId={defaultSubjectId}
    />
  );
}

function FlashcardForm({ onClose, onSaved, subjects, card, defaultSubjectId }: Omit<FlashcardDialogProps, 'open'>) {
  const { show } = useToast();
  const [subjectId, setSubjectId] = useState(card?.subject_id ?? defaultSubjectId ?? subjects[0]?.id ?? '');
  const [front, setFront] = useState(card?.front ?? '');
  const [back, setBack] = useState(card?.back ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!front.trim() || !back.trim()) {
      setError('Vul de vraag en het antwoord in.');
      return;
    }
    if (!card && !subjectId) {
      setError('Kies een vak voor deze kaart.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (card) {
        await updateFlashcard(card.id, { front, back });
        show('Flashcard bijgewerkt.');
      } else {
        await createFlashcard({ subject_id: subjectId, front, back });
        show('Flashcard toegevoegd.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(toUserMessage(err, 'De flashcard kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={card ? 'Flashcard bewerken' : 'Nieuwe flashcard'}
      description="Schrijf een vraag of begrip aan de voorkant en het antwoord aan de achterkant."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuleren
          </Button>
          <Button type="submit" form="flashcard-form" loading={saving}>
            Opslaan
          </Button>
        </>
      }
    >
      <form id="flashcard-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {!card && (
          <Field label="Vak" htmlFor="flashcard-subject">
            <select id="flashcard-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={inputClass}>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Voorkant" htmlFor="flashcard-front" error={error}>
          <textarea id="flashcard-front" value={front} onChange={(event) => setFront(event.target.value)} maxLength={500} className={textareaClass} />
        </Field>
        <Field label="Achterkant" htmlFor="flashcard-back">
          <textarea id="flashcard-back" value={back} onChange={(event) => setBack(event.target.value)} maxLength={1000} className={textareaClass} />
        </Field>
      </form>
    </Modal>
  );
}
