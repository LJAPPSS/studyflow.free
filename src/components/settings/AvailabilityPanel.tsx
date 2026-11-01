import { useState, type FormEvent } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { WEEKDAYS } from '@/lib/constants';
import { formatShortDate, formatTime, todayIso } from '@/lib/format';
import { toUserMessage } from '@/lib/errors';
import { createAvailabilityBlock, deleteAvailabilityBlock } from '@/services/availability';
import type { AvailabilityBlock } from '@/types/study';

type Kind = AvailabilityBlock['kind'];
const EXCEPTION = 'exception';

export function AvailabilityPanel() {
  const { data, refresh } = useStudyData();
  const { show } = useToast();
  const [kind, setKind] = useState<Kind>('studietijd');
  const [repeat, setRepeat] = useState<string>('0');
  const [date, setDate] = useState(todayIso());
  const [start, setStart] = useState('16:00');
  const [end, setEnd] = useState('18:00');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<AvailabilityBlock | null>(null);

  const weekly = (kindFilter: Kind) => data.availability.filter((block) => block.kind === kindFilter && block.weekday !== null);
  const exceptions = data.availability.filter((block) => block.specific_date !== null);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!start || !end || end <= start) {
      setError('De eindtijd moet na de begintijd liggen.');
      return;
    }
    const isException = repeat === EXCEPTION;
    if (isException && !date) {
      setError('Kies een datum voor deze uitzondering.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createAvailabilityBlock({
        kind,
        weekday: isException ? null : Number(repeat),
        specific_date: isException ? date : null,
        start_time: start,
        end_time: end,
        label: label.trim() || null,
      });
      await refresh();
      setLabel('');
      show('Blok toegevoegd.');
    } catch (err) {
      setError(toUserMessage(err, 'Het blok kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setSaving(true);
    try {
      await deleteAvailabilityBlock(toDelete.id);
      await refresh();
      show('Blok verwijderd.');
      setToDelete(null);
    } catch (err) {
      show(toUserMessage(err, 'Het blok kon niet worden verwijderd.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card sm:!p-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Blok toevoegen</h2>
        <p className="mt-1 mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          Studietijd is een moment waarop je wilt leren. Een verplichting is iets wat je vaste tijd kost, zoals sport of werk.
        </p>
        <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2" role="radiogroup" aria-label="Soort blok">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
              {(
                [
                  { value: 'studietijd', label: 'Studietijd' },
                  { value: 'verplichting', label: 'Verplichting' },
                ] as { value: Kind; label: string }[]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={kind === option.value}
                  onClick={() => setKind(option.value)}
                  className={cn(
                    'rounded-lg py-2 text-sm font-medium transition',
                    kind === option.value ? 'bg-panel text-ink shadow-hard-sm' : 'text-neutral-500 dark:text-neutral-400',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Herhaling" htmlFor="avail-repeat">
            <select id="avail-repeat" value={repeat} onChange={(event) => setRepeat(event.target.value)} className={inputClass}>
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  Elke {day.label.toLowerCase()}
                </option>
              ))}
              <option value={EXCEPTION}>Eenmalig op een datum</option>
            </select>
          </Field>
          {repeat === EXCEPTION ? (
            <Field label="Datum" htmlFor="avail-date">
              <input id="avail-date" type="date" min={todayIso()} value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
            </Field>
          ) : (
            <Field label="Naam" htmlFor="avail-label" hint="Optioneel">
              <input id="avail-label" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={60} placeholder="bv. Voetbaltraining" className={inputClass} />
            </Field>
          )}
          <Field label="Van" htmlFor="avail-start">
            <input id="avail-start" type="time" value={start} onChange={(event) => setStart(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Tot" htmlFor="avail-end" error={error}>
            <input id="avail-end" type="time" value={end} onChange={(event) => setEnd(event.target.value)} className={inputClass} />
          </Field>
          {repeat === EXCEPTION && (
            <Field label="Naam" htmlFor="avail-label-exception" hint="Optioneel" className="sm:col-span-2">
              <input id="avail-label-exception" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={60} className={inputClass} />
            </Field>
          )}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" loading={saving}>
              <Plus className="h-4 w-4" />
              Blok toevoegen
            </Button>
          </div>
        </form>
      </section>

      {data.availability.length === 0 ? (
        <EmptyState icon={Clock} title="Nog geen blokken" description="Voeg studietijd of vaste verplichtingen toe, dan kan StudyFlow later je planning beter verdelen." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <BlockGroup title="Studietijd per week" blocks={weekly('studietijd')} onDelete={setToDelete} />
          <BlockGroup title="Vaste verplichtingen" blocks={weekly('verplichting')} onDelete={setToDelete} />
          <BlockGroup
            title="Eenmalige uitzonderingen"
            blocks={exceptions}
            onDelete={setToDelete}
            className="lg:col-span-2"
          />
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Blok verwijderen?"
        description="Dit blok wordt uit je beschikbaarheid gehaald."
        confirmLabel="Verwijderen"
        loading={saving}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

function BlockGroup({
  title,
  blocks,
  onDelete,
  className,
}: {
  title: string;
  blocks: AvailabilityBlock[];
  onDelete: (block: AvailabilityBlock) => void;
  className?: string;
}) {
  return (
    <section className={cn('card', className)}>
      <h3 className="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      {blocks.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Niets ingesteld.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {blocks.map((block) => (
            <li key={block.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {block.specific_date
                    ? formatShortDate(block.specific_date)
                    : WEEKDAYS[block.weekday ?? 0].label}
                  <span className="font-normal text-neutral-500 dark:text-neutral-400">
                    {' '}· {formatTime(block.start_time)} tot {formatTime(block.end_time)}
                  </span>
                </p>
                {block.label && <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{block.label}</p>}
              </div>
              <button
                type="button"
                aria-label="Blok verwijderen"
                onClick={() => onDelete(block)}
                className="shrink-0 rounded-lg p-2 text-neutral-500 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-600/15 dark:hover:text-error-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
