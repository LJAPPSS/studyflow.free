import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { FlashcardDialog } from '@/components/flashcards/FlashcardDialog';
import { FlashcardStudy } from '@/components/flashcards/FlashcardStudy';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/constants';
import { toUserMessage } from '@/lib/errors';
import { deleteFlashcard, listFlashcards } from '@/services/flashcards';
import type { Flashcard } from '@/types/study';

export function FlashcardsPage() {
  const { data } = useStudyData();
  const { show } = useToast();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterId, setFilterId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [studySubjectId, setStudySubjectId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Flashcard | null>(null);
  const [deleting, setDeleting] = useState(false);

  const subjectById = useMemo(() => new Map(data.subjects.map((subject) => [subject.id, subject])), [data.subjects]);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCards(await listFlashcards());
    } catch (err) {
      setLoadError(toUserMessage(err, 'De flashcards konden niet worden geladen.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  const visibleCards = filterId ? cards.filter((card) => card.subject_id === filterId) : cards;
  const groups = data.subjects
    .map((subject) => ({ subject, cards: visibleCards.filter((card) => card.subject_id === subject.id) }))
    .filter((group) => group.cards.length > 0);
  const studyCards = studySubjectId ? cards.filter((card) => card.subject_id === studySubjectId) : [];
  const studySubject = studySubjectId ? subjectById.get(studySubjectId) : undefined;

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (card: Flashcard) => {
    setEditing(card);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteFlashcard(pendingDelete.id);
      setCards((items) => items.filter((item) => item.id !== pendingDelete.id));
      show('Flashcard verwijderd.');
      setPendingDelete(null);
    } catch (err) {
      show(toUserMessage(err, 'De flashcard kon niet worden verwijderd.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderBody = () => {
    if (loading) return <p className="text-sm text-neutral-500 dark:text-neutral-400">Flashcards laden...</p>;
    if (loadError) {
      return (
        <EmptyState
          icon={Layers}
          title="Flashcards konden niet worden geladen"
          description={loadError}
          action={
            <Button variant="secondary" size="sm" onClick={() => void loadCards()}>
              Opnieuw proberen
            </Button>
          }
        />
      );
    }
    if (data.subjects.length === 0) {
      return (
        <EmptyState icon={Layers} title="Nog geen vakken" description="Voeg eerst een vak toe. Daarna kun je er flashcards bij maken." />
      );
    }
    if (cards.length === 0) {
      return (
        <EmptyState
          icon={Layers}
          title="Nog geen flashcards"
          description="Maak kaartjes met een vraag aan de voorkant en het antwoord aan de achterkant."
          action={
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Eerste flashcard maken
            </Button>
          }
        />
      );
    }
    return (
      <div className="space-y-6">
        {groups.map(({ subject, cards: subjectCards }) => (
          <section key={subject.id} className="card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={cn('h-3 w-3 rounded-full', SUBJECT_COLORS[subject.color].dot)} />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{subject.name}</h2>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{subjectCards.length}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setStudySubjectId(subject.id)}>
                <Play className="h-3.5 w-3.5" />
                Oefenen
              </Button>
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
              {subjectCards.map((card) => (
                <li key={card.id} className="group flex items-start gap-3 rounded-2xl border-2 border-outline bg-panel p-4 dark:bg-neutral-800">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900 whitespace-pre-wrap break-words dark:text-neutral-100">{card.front}</p>
                    <p className="mt-2 text-sm text-neutral-600 whitespace-pre-wrap break-words dark:text-neutral-300">{card.back}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(card)}
                      aria-label="Flashcard bewerken"
                      className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(card)}
                      aria-label="Flashcard verwijderen"
                      className="rounded-lg p-2 text-neutral-500 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-600/15 dark:hover:text-error-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
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
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Flashcards</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">Oefen de belangrijkste begrippen per vak.</p>
        </div>
        <Button onClick={openNew} disabled={data.subjects.length === 0}>
          <Plus className="h-4 w-4" />
          Nieuwe flashcard
        </Button>
      </div>

      {data.subjects.length > 0 && cards.length > 0 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter op vak">
          <FilterChip label="Alle vakken" active={filterId === null} onClick={() => setFilterId(null)} />
          {data.subjects.map((subject) => (
            <FilterChip key={subject.id} label={subject.name} active={filterId === subject.id} onClick={() => setFilterId(subject.id)} />
          ))}
        </div>
      )}

      {renderBody()}

      <FlashcardDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadCards}
        subjects={data.subjects}
        card={editing}
        defaultSubjectId={filterId}
      />

      <FlashcardStudy
        open={studySubjectId !== null}
        onClose={() => setStudySubjectId(null)}
        title={studySubject ? `Oefenen: ${studySubject.name}` : 'Oefenen'}
        cards={studyCards}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Flashcard verwijderen?"
        description="Deze flashcard wordt verwijderd. Dit kan niet ongedaan worden gemaakt."
        confirmLabel="Verwijderen"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-[transform,background-color] duration-[180ms] active:scale-95',
        active
          ? 'border-outline bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500'
          : 'border-transparent bg-neutral-100 text-neutral-700 hover:border-outline hover:bg-selection dark:bg-neutral-800 dark:text-neutral-300',
      )}
    >
      {label}
    </button>
  );
}
