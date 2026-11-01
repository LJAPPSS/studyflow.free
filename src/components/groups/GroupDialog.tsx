import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { createStudyGroup, joinStudyGroup } from '@/services/studyGroups';
import { toUserMessage } from '@/lib/errors';

export type GroupDialogMode = 'create' | 'join';

type GroupDialogProps = {
  mode: GroupDialogMode | null;
  onClose: () => void;
  onDone: (groupId: string) => Promise<void>;
};

const COPY: Record<GroupDialogMode, { title: string; description: string; submit: string; field: string }> = {
  create: {
    title: 'Studiegroep maken',
    description: 'Geef je groep een naam. Je krijgt daarna een code die je met vrienden kunt delen.',
    submit: 'Groep maken',
    field: 'Naam van de groep',
  },
  join: {
    title: 'Studiegroep joinen',
    description: 'Vul de code in die je van een groepslid hebt gekregen.',
    submit: 'Joinen',
    field: 'Groepscode',
  },
};

export function GroupDialog({ mode, onClose, onDone }: GroupDialogProps) {
  const { show } = useToast();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const open = mode !== null;
  const copy = mode ? COPY[mode] : COPY.create;

  const close = () => {
    if (saving) return;
    setValue('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mode) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setError(mode === 'create' ? 'Geef de groep een naam.' : 'Vul een code in.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const groupId = mode === 'create' ? await createStudyGroup(trimmed) : await joinStudyGroup(trimmed);
      show(mode === 'create' ? 'Studiegroep gemaakt.' : 'Je bent toegevoegd aan de studiegroep.');
      setValue('');
      await onDone(groupId);
    } catch (err) {
      setError(toUserMessage(err, 'Dat is niet gelukt. Controleer de gegevens en probeer opnieuw.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={copy.title}
      description={copy.description}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Annuleren
          </Button>
          <Button type="submit" form="group-form" loading={saving}>
            {copy.submit}
          </Button>
        </>
      }
    >
      <form id="group-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label={copy.field} htmlFor="group-input" error={error}>
          <input
            id="group-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={mode === 'create' ? 60 : 16}
            className={inputClass}
            autoFocus
          />
        </Field>
      </form>
    </Modal>
  );
}
