import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { toUserMessage } from '@/lib/errors';
import { askAssistant, type AssistantMessage } from '@/services/assistant';

const SUGGESTIONS = [
  'Leg de tweedegraadsvergelijking uit met een voorbeeld.',
  'Geef me 5 oefenvragen over de Franse tijden.',
  'Hoe kan ik het best leren voor een toets van twee weken?',
];

export function AssistantPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    const next: AssistantMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setDraft('');
    setSending(true);
    setError(null);
    try {
      const reply = await askAssistant(next);
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(toUserMessage(err, 'De AI-assistent gaf geen antwoord. Probeer het opnieuw.'));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[28rem] flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">AI-studieassistent</h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Stel een vraag over je vakken. Gesprekken worden niet opgeslagen.</p>
      </div>

      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-5 py-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border-[3px] border-outline bg-accent-600 text-white shadow-hard-sm">
                <Bot className="h-7 w-7" />
              </span>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">Waar kan ik je mee helpen?</p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Probeer een van deze vragen.</p>
              </div>
              <div className="grid w-full max-w-xl gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="rounded-xl border-[3px] border-outline bg-panel px-4 py-3 text-left text-sm font-medium text-ink transition duration-[180ms] hover:bg-selection hover:shadow-hard-sm active:scale-[0.98]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}>
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-outline',
                  message.role === 'user' ? 'bg-warm text-ink' : 'bg-accent-600 text-white',
                )}
                aria-hidden="true"
              >
                {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </span>
              <p
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-xl border-2 border-outline px-4 py-3 text-sm leading-relaxed',
                  message.role === 'user' ? 'bg-selection text-ink' : 'bg-panel text-ink',
                )}
              >
                {message.content}
              </p>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3" aria-live="polite">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-outline bg-accent-600 text-white">
                <Bot className="h-4 w-4" />
              </span>
              <p className="rounded-xl border-2 border-outline bg-panel px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">Aan het nadenken...</p>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl border-2 border-error-600 bg-error-50 px-4 py-3 text-sm font-medium text-error-700 dark:bg-error-600/15 dark:text-error-300">
              {error}
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-3 border-t-[3px] border-outline bg-ground p-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={2000}
            rows={2}
            placeholder="Typ je vraag..."
            aria-label="Je vraag aan de studieassistent"
            className={cn(inputClass, 'min-h-[3rem] resize-none')}
          />
          <Button type="submit" disabled={!draft.trim() || sending} loading={sending} aria-label="Versturen">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Versturen</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
