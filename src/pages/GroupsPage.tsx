import { useCallback, useEffect, useState } from 'react';
import { Plus, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GroupDetail } from '@/components/groups/GroupDetail';
import { GroupDialog, type GroupDialogMode } from '@/components/groups/GroupDialog';
import { cn } from '@/lib/cn';
import { toUserMessage } from '@/lib/errors';
import { listMyStudyGroups } from '@/services/studyGroups';
import type { StudyGroup } from '@/types/study';

export function GroupsPage() {
  const [groups, setGroups] = useState<StudyGroup[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<GroupDialogMode | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      const rows = await listMyStudyGroups();
      setGroups(rows);
      setLoadError(null);
      setSelectedId((current) => (current && rows.some((group) => group.id === current) ? current : (rows[0]?.id ?? null)));
    } catch (err) {
      setLoadError(toUserMessage(err, 'De studiegroepen konden niet worden geladen.'));
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleDone = async (groupId: string) => {
    setDialogMode(null);
    await loadGroups();
    setSelectedId(groupId);
  };

  const selectedGroup = groups?.find((group) => group.id === selectedId) ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Studiegroepen</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">Studeer samen en zie wie er deze week het hardst werkt.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setDialogMode('join')}>
            <UserPlus className="h-4 w-4" />
            Joinen met code
          </Button>
          <Button onClick={() => setDialogMode('create')}>
            <Plus className="h-4 w-4" />
            Groep maken
          </Button>
        </div>
      </div>

      {loadError ? (
        <p role="alert" className="text-sm font-semibold text-error-600 dark:text-error-300">
          {loadError}
        </p>
      ) : groups === null ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Laden...</p>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Je zit nog in geen groep"
          description="Maak een studiegroep en deel de code met vrienden, of join met een code die je hebt gekregen."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <ul className="space-y-2">
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(group.id)}
                  aria-current={group.id === selectedId ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-playful border-[3px] px-4 py-3 text-left text-sm font-semibold transition-[transform,box-shadow] duration-[180ms] ease-out active:scale-[0.98]',
                    group.id === selectedId
                      ? 'border-outline bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500'
                      : 'border-transparent text-neutral-700 hover:translate-x-1 hover:border-outline hover:bg-selection dark:text-neutral-300',
                  )}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate">{group.name}</span>
                </button>
              </li>
            ))}
          </ul>
          {selectedGroup && <GroupDetail key={selectedGroup.id} group={selectedGroup} onLeft={loadGroups} />}
        </div>
      )}

      <GroupDialog mode={dialogMode} onClose={() => setDialogMode(null)} onDone={handleDone} />
    </div>
  );
}
