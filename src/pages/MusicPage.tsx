import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ListMusic, Music, Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field, inputClass } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { parseMusicLink } from '@/lib/musicLinks';
import { toUserMessage } from '@/lib/errors';
import { addMusicPlaylist, deleteMusicPlaylist, listMusicPlaylists, type MusicPlaylist } from '@/services/musicPlaylists';

const PROVIDER_LABEL: Record<MusicPlaylist['provider'], string> = {
  spotify: 'Spotify',
  youtube: 'YouTube',
};

export function MusicPage() {
  const { show } = useToast();
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MusicPlaylist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const items = await listMusicPlaylists();
      setPlaylists(items);
      setSelectedId((current) => current ?? items[0]?.id ?? null);
    } catch (err) {
      setLoadError(toUserMessage(err, 'De muziekspeler kon niet worden geladen.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  const selected = playlists.find((item) => item.id === selectedId) ?? null;

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setFormError('Geef de afspeellijst een naam.');
      return;
    }
    const parsed = parseMusicLink(url);
    if (!parsed) {
      setFormError('Plak een link naar een Spotify- of YouTube-afspeellijst, album of nummer.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await addMusicPlaylist({
        label: trimmedLabel,
        provider: parsed.provider,
        embed_url: parsed.embedUrl,
        source_url: url.trim(),
      });
      setPlaylists((items) => [...items, created]);
      setSelectedId(created.id);
      setLabel('');
      setUrl('');
      show(`"${trimmedLabel}" toegevoegd.`);
    } catch (err) {
      setFormError(toUserMessage(err, 'De afspeellijst kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteMusicPlaylist(pendingDelete.id);
      setPlaylists((items) => items.filter((item) => item.id !== pendingDelete.id));
      if (selectedId === pendingDelete.id) setSelectedId(null);
      show('Afspeellijst verwijderd.');
      setPendingDelete(null);
    } catch (err) {
      show(toUserMessage(err, 'De afspeellijst kon niet worden verwijderd.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderPlaylists = () => {
    if (loading) return <p className="text-sm text-neutral-500 dark:text-neutral-400">Afspeellijsten laden...</p>;
    if (loadError) {
      return (
        <EmptyState
          icon={Music}
          title="Afspeellijsten konden niet worden geladen"
          description={loadError}
          action={
            <Button variant="secondary" size="sm" onClick={() => void loadPlaylists()}>
              Opnieuw proberen
            </Button>
          }
        />
      );
    }
    if (playlists.length === 0) {
      return <EmptyState icon={ListMusic} title="Nog geen afspeellijsten" description="Voeg hieronder je eerste Spotify- of YouTube-link toe." />;
    }
    return (
      <ul className="space-y-2">
        {playlists.map((item) => {
          const active = item.id === selectedId;
          return (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-2 rounded-2xl border-2 p-2 transition-colors',
                active ? 'border-outline bg-selection dark:bg-neutral-800' : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800',
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                aria-current={active ? 'true' : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 text-left"
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-outline', active ? 'bg-accent-600 text-white' : 'bg-panel text-neutral-700 dark:text-neutral-200')}>
                  <Play className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.label}</span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">{PROVIDER_LABEL[item.provider]}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(item)}
                aria-label={`${item.label} verwijderen`}
                className="rounded-lg p-2 text-neutral-500 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-600/15 dark:hover:text-error-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Studiemuziek</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">Speel je favoriete Spotify- of YouTube-lijst af terwijl je studeert.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card lg:col-span-2 sm:!p-6">
          {selected ? (
            <iframe
              key={selected.id}
              src={selected.embed_url}
              title={selected.label}
              width="100%"
              height="352"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="rounded-2xl border-2 border-outline"
            />
          ) : (
            <EmptyState icon={Music} title="Kies een afspeellijst" description="Selecteer een lijst rechts om hem hier af te spelen." />
          )}
        </section>

        <aside className="space-y-5">
          <section className="card">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Mijn lijsten</h2>
            {renderPlaylists()}
          </section>

          <section className="card">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Lijst toevoegen</h2>
            <form onSubmit={handleAdd} className="space-y-4" noValidate>
              <Field label="Naam" htmlFor="music-label">
                <input id="music-label" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} placeholder="Bijv. Focusmuziek" className={inputClass} />
              </Field>
              <Field label="Link" htmlFor="music-url" error={formError}>
                <input
                  id="music-url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                  className={inputClass}
                />
              </Field>
              <Button type="submit" loading={saving} className="w-full">
                <Plus className="h-4 w-4" />
                Toevoegen
              </Button>
            </form>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Afspeellijst verwijderen?"
        description={pendingDelete ? `"${pendingDelete.label}" wordt uit je lijst gehaald. De lijst zelf blijft bestaan bij ${PROVIDER_LABEL[pendingDelete.provider]}.` : ''}
        confirmLabel="Verwijderen"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
