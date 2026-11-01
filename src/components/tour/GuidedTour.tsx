import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Bot, CalendarDays, GraduationCap, Layers, LayoutDashboard, Settings, Timer, type LucideIcon } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { navigate } from '@/lib/router';
import { toUserMessage } from '@/lib/errors';
import { setTourCompleted } from '@/services/profile';

type TourStep = {
  title: string;
  body: string;
  icon: LucideIcon;
  path?: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welkom bij StudyFlow',
    body: 'Deze korte rondleiding laat zien waar je alles vindt. Je kunt hem op elk moment overslaan en later opnieuw starten via Hulp.',
    icon: GraduationCap,
  },
  {
    title: 'Je dashboard',
    body: 'Hier zie je in een oogopslag je vakken en de examens die het eerst aankomen. Met het zoekveld bovenaan vind je snel een vak of examen.',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    title: 'Voeg je vakken toe',
    body: 'Geef elk vak een kleur, een moeilijkheid en je huidige zekerheid. Voeg daarna je examens toe, dan weet je wat je wanneer moet leren.',
    icon: BookOpen,
    path: '/vakken',
  },
  {
    title: 'Vraag het aan de studieassistent',
    body: 'Stel een vraag of vraag om uitleg, bijvoorbeeld: leg de fotosynthese uit in vijf zinnen. Controleer belangrijke feiten altijd ook in je boek.',
    icon: Bot,
    path: '/assistent',
  },
  {
    title: 'Oefen met flashcards',
    body: 'Maak kaartjes met een vraag en een antwoord, gekoppeld aan een vak. Markeer ze als gekend of nog oefenen om je voortgang te volgen.',
    icon: Layers,
    path: '/flashcards',
  },
  {
    title: 'Werk in concentratieblokken',
    body: 'Start de Focus-timer voor een werkblok van 25 of 50 minuten. Afspeellijsten om bij te studeren vind je onder Studiemuziek.',
    icon: Timer,
    path: '/focus',
  },
  {
    title: 'Overzicht in de kalender',
    body: 'De kalender toont je examens per maand. Klik op een dag om te zien wat er die dag gepland staat.',
    icon: CalendarDays,
    path: '/kalender',
  },
  {
    title: 'Pas alles aan',
    body: 'Wijzig je profiel, je schooljaar, je examenperiodes en je beschikbare studietijd in Instellingen. Daarna ben je klaar om te starten.',
    icon: Settings,
    path: '/instellingen',
  },
];

export function GuidedTour({ userId }: { userId: string }) {
  const { refresh } = useStudyData();
  const { show } = useToast();
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const step = TOUR_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === TOUR_STEPS.length - 1;
  const StepIcon = step.icon;

  const goTo = (next: number) => {
    setIndex(next);
    const path = TOUR_STEPS[next].path;
    if (path) navigate(path);
  };

  const finish = async () => {
    setSaving(true);
    try {
      await setTourCompleted(userId, true);
      await refresh();
    } catch (error) {
      show(toUserMessage(error, 'De rondleiding kon niet worden afgesloten. Probeer het opnieuw.'), 'error');
      setSaving(false);
    }
  };

  return (
    <section
      aria-label="Rondleiding"
      className="fixed inset-x-3 bottom-3 z-50 rounded-playful border-[3px] border-outline bg-panel p-5 text-ink shadow-hard-lg animate-scale-in sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
          Stap {index + 1} van {TOUR_STEPS.length}
        </p>
        <button
          type="button"
          onClick={finish}
          disabled={saving}
          className="rounded-xl px-2 py-1 text-sm font-semibold text-neutral-600 transition hover:bg-selection hover:text-ink disabled:opacity-60 dark:text-neutral-300"
        >
          Overslaan
        </button>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-rule-muted" role="progressbar" aria-valuemin={1} aria-valuemax={TOUR_STEPS.length} aria-valuenow={index + 1}>
        <div
          className="h-full rounded-full bg-accent-600 transition-[width] duration-300 ease-out dark:bg-accent-400"
          style={{ width: `${((index + 1) / TOUR_STEPS.length) * 100}%` }}
        />
      </div>

      <div key={index} className="mt-5 animate-fade-in">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-outline bg-selection shadow-hard-sm">
            <StepIcon className="h-5 w-5 text-accent-700 dark:text-accent-300" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-snug text-ink">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{step.body}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => goTo(index - 1)} disabled={isFirst || saving}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Vorige
        </Button>
        {isLast ? (
          <Button onClick={finish} loading={saving}>
            Klaar
          </Button>
        ) : (
          <Button onClick={() => goTo(index + 1)} disabled={saving}>
            Volgende
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </section>
  );
}
