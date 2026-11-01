import { useEffect, useState } from 'react';
import { Copy, LogOut, Users } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { formatDuration, todayIso } from '@/lib/format';
import { toUserMessage } from '@/lib/errors';
import { weekStart } from '@/lib/studyStats';
import { leaveStudyGroup, loadGroupMembers } from '@/services/studyGroups';
import type { GroupMember, StudyGroup } from '@/types/study';

type GroupDetailProps = {
  group: StudyGroup;
  onLeft: () => Promise<void>;
};

export function GroupDetail({ group, onLeft }: GroupDetailProps) {
  const { userId } = useStudyData();
  const { show } = useToast();
  const [members, setMembers] = useState<GroupMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMembers(null);
    setLoadError(null);
    loadGroupMembers(group.id, weekStart(todayIso()))
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(toUserMessage(err, 'De leden konden niet worden geladen.'));
      });
    return () => {
      cancelled = true;
    };
  }, [group.id]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      show('Code gekopieerd.');
    } catch {
      show('Kopiëren lukt niet. Schrijf de code over.', 'error');
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveStudyGroup(group.id, userId);
      setConfirmLeave(false);
      await onLeft();
    } catch (err) {
      show(toUserMessage(err, 'Je kunt de groep nu niet verlaten.'), 'error');
    } finally {
      setLeaving(false);
    }
  };

  return (
    <section className="card space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-neutral-900 dark:text-neutral-50">{group.name}</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Code: <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">{group.invite_code}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={copyCode}>
            <Copy className="h-4 w-4" />
            Code kopiëren
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(true)}>
            <LogOut className="h-4 w-4" />
            Verlaten
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Studietijd deze week</h3>
        {loadError ? (
          <p role="alert" className="text-sm font-semibold text-error-600 dark:text-error-300">
            {loadError}
          </p>
        ) : members === null ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Laden...</p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {members.map((member) => (
              <li key={member.user_id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-outline bg-panel dark:bg-neutral-800">
                  <Users className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {member.name}
                  {member.user_id === userId && <span className="font-normal text-neutral-500 dark:text-neutral-400"> (jij)</span>}
                </span>
                <span className="shrink-0 text-sm text-neutral-600 dark:text-neutral-400">{formatDuration(member.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmLeave}
        title="Groep verlaten?"
        description={`Je verlaat "${group.name}". Je kunt later opnieuw joinen met de code.`}
        confirmLabel="Verlaten"
        loading={leaving}
        onConfirm={handleLeave}
        onClose={() => {
          if (!leaving) setConfirmLeave(false);
        }}
      />
    </section>
  );
}
