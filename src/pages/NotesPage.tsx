import { useEffect, useMemo, useState } from 'react';
import { NotebookPen, Save } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/constants';
import { toUserMessage } from '@/lib/errors';
import { saveSubjectNote } from '@/services/subjectNotes';

const MAX_NOTE_LENGTH = 20000;

export function NotesPage() {
  const { data, refresh } = useStudyData();
  const { show } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(data.subjects[0]?.id ?? null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savedBodyBySubject = useMemo(
    () => new Map(data.subjectNotes.map((note) => [note.subject_id, note.body])),
    [data.subjectNotes],
  );

  const selectedSubject = data.subjects.find((subject) => subject.id === selectedId) ?? null;
  const savedBody = selectedSubject ? (savedBodyBySubject.get(selectedSubject.id) ?? '') : '';

  useEffect(() => {
    setDraft(savedBody);
    setError(null);
  }, [selectedId, savedBody]);

  const dirty = draft !== savedBody;

  const handleSave = async () => {
    if (!selectedSubject) return;
    setSaving(true);
    setError(null);
    try {
      await saveSubjectNote(selectedSubject.id, draft);
      await refresh();
      show('Notitie opgeslagen.');
    } catch (err) {
      setError(toUserMessage(err, 'De notitie kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  if (data.subjects.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Notities</h1>
        <EmptyState icon={NotebookPen} title="Nog geen vakken" description="Voeg eerst een vak toe, dan kun je er notities bij maken." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Notities</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">Een notitie per vak, zodat je samenvattingen altijd bij de hand hebt.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <ul className="space-y-2">
          {data.subjects.map((subject) => {
            const active = subject.id === selectedId;
            const hasNote = (savedBodyBySubject.get(subject.id) ?? '').trim().length > 0;
            return (
              <li key={subject.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(subject.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-playful border-[3px] px-4 py-3 text-left text-sm font-semibold transition-[transform,box-shadow] duration-[180ms] ease-out active:scale-[0.98]',
                    active
                      ? 'border-outline bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500'
                      : 'border-transparent text-neutral-700 hover:translate-x-1 hover:border-outline hover:bg-selection dark:text-neutral-300',
                  )}
                >
                  <span className={cn('h-3 w-3 shrink-0 rounded-full', SUBJECT_COLORS[subject.color].dot)} />
                  <span className="min-w-0 flex-1 truncate">{subject.name}</span>
                  {hasNote && <span className="text-xs font-medium opacity-80">Notitie</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {selectedSubject && (
          <section className="card space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{selectedSubject.name}</h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {draft.length} / {MAX_NOTE_LENGTH}
              </span>
            </div>
            <textarea
              aria-label={`Notitie voor ${selectedSubject.name}`}
              value={draft}
              maxLength={MAX_NOTE_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              rows={14}
              placeholder="Schrijf hier samenvattingen, formules of vragen voor dit vak."
              className="block w-full resize-y rounded-playful border-[3px] border-outline bg-panel p-4 text-sm leading-relaxed text-ink placeholder:text-neutral-500 focus:outline-none dark:placeholder:text-neutral-400"
            />
            {error && (
              <p role="alert" className="text-sm font-semibold text-error-600 dark:text-error-300">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{dirty ? 'Niet-opgeslagen wijzigingen' : 'Alles is opgeslagen'}</p>
              <Button onClick={handleSave} loading={saving} disabled={!dirty}>
                <Save className="h-4 w-4" />
                Opslaan
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
