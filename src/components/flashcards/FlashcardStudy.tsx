import { useState } from 'react';
import { Check, RotateCcw, RotateCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { Flashcard } from '@/types/study';

type FlashcardStudyProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  cards: Flashcard[];
};

export function FlashcardStudy({ open, onClose, title, cards }: FlashcardStudyProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setKnownIds([]);
    setFinished(false);
  };

  const advance = (known: boolean) => {
    const card = cards[index];
    if (known) setKnownIds((ids) => [...ids, card.id]);
    setFlipped(false);
    if (index + 1 >= cards.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  };

  const handleClose = () => {
    restart();
    onClose();
  };

  const card = cards[index];

  return (
    <Modal open={open} onClose={handleClose} title={title} description={cards.length > 0 ? `${cards.length} kaarten om te oefenen` : undefined} size="lg">
      {cards.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Er zijn nog geen flashcards voor dit vak.</p>
      ) : finished ? (
        <div className="flex flex-col items-center gap-5 py-6 text-center animate-scale-in">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-outline bg-accent-600 text-white shadow-hard-sm">
            <Check className="h-7 w-7" />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">Ronde klaar</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              Je kende {knownIds.length} van de {cards.length} kaarten.
            </p>
          </div>
          <Button onClick={restart}>
            <RotateCcw className="h-4 w-4" />
            Opnieuw oefenen
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-sm font-medium text-neutral-600 dark:text-neutral-300">
            <span>
              Kaart {index + 1} van {cards.length}
            </span>
            <span>Gekend: {knownIds.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div className="h-full rounded-full bg-accent-600 transition-all duration-500" style={{ width: `${(index / cards.length) * 100}%` }} />
          </div>

          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            aria-label={flipped ? 'Toon de vraag' : 'Toon het antwoord'}
            className="group relative flex min-h-[220px] w-full items-center justify-center rounded-playful border-[3px] border-outline bg-panel p-8 text-center shadow-hard transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg dark:bg-neutral-800"
          >
            <span key={`${card.id}-${flipped}`} className="animate-scale-in text-lg font-medium leading-relaxed text-ink whitespace-pre-wrap">
              {flipped ? card.back : card.front}
            </span>
            <span className="absolute bottom-3 right-4 inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <RotateCw className="h-3.5 w-3.5" />
              {flipped ? 'Antwoord' : 'Vraag'}
            </span>
          </button>

          <div className={cn('grid grid-cols-2 gap-3', !flipped && 'opacity-60')}>
            <Button variant="secondary" onClick={() => advance(false)} disabled={!flipped}>
              Nog oefenen
            </Button>
            <Button onClick={() => advance(true)} disabled={!flipped}>
              <Check className="h-4 w-4" />
              Gekend
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
