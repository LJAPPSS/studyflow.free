import { useState } from 'react';
import { ChevronDown, CircleHelp, Compass, Lightbulb, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { HELP_ERRORS, HELP_GUIDE, type HelpTopic } from '@/lib/helpContent';
import { navigate } from '@/lib/router';
import { toUserMessage } from '@/lib/errors';
import { setTourCompleted } from '@/services/profile';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

type HelpTab = 'guide' | 'errors';

const TABS: { key: HelpTab; label: string; icon: LucideIcon }[] = [
  { key: 'guide', label: 'Gids', icon: Lightbulb },
  { key: 'errors', label: 'Foutmeldingen', icon: TriangleAlert },
];

const TOPICS: Record<HelpTab, HelpTopic[]> = {
  guide: HELP_GUIDE,
  errors: HELP_ERRORS,
};

const INTRO: Record<HelpTab, string> = {
  guide: 'Stap voor stap uitgelegd hoe je de belangrijkste onderdelen van StudyFlow gebruikt.',
  errors: 'Loop je ergens tegenaan? Hier vind je wat de meldingen betekenen en wat je kunt doen.',
};

export function HelpPage() {
  const [tab, setTab] = useState<HelpTab>('guide');
  const [restarting, setRestarting] = useState(false);
  const { user } = useAuth();
  const { refresh } = useStudyData();
  const { show } = useToast();

  const restartTour = async () => {
    if (!user) return;
    setRestarting(true);
    try {
      await setTourCompleted(user.id, false);
      await refresh();
      navigate('/dashboard');
    } catch (error) {
      show(toUserMessage(error, 'De rondleiding kon niet opnieuw worden gestart.'), 'error');
    }
    setRestarting(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Hulp</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{INTRO[tab]}</p>
        <Button variant="secondary" onClick={restartTour} loading={restarting} className="mt-4">
          <Compass className="h-4 w-4" aria-hidden="true" />
          Start de rondleiding opnieuw
        </Button>
      </div>

      <div role="tablist" aria-label="Hulponderwerpen" className="inline-flex rounded-2xl border-2 border-outline bg-panel p-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95',
                active ? 'bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500' : 'text-neutral-600 hover:bg-selection dark:text-neutral-400 dark:hover:bg-neutral-800',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="space-y-3">
        {TOPICS[tab].map((topic) => (
          <details key={topic.id} className="card group !p-0 open:shadow-hard-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-neutral-900 dark:text-neutral-100">
              <span className="flex items-center gap-3">
                <CircleHelp className="h-5 w-5 shrink-0 text-accent-600 dark:text-accent-400" />
                {topic.question}
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="space-y-3 border-t-2 border-outline px-5 py-4 pl-[3.25rem] text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {topic.answer.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
