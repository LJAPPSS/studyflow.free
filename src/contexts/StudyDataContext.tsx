import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { loadStudyData } from '@/services/studyData';
import { Button } from '@/components/ui/Button';
import { toUserMessage } from '@/lib/errors';
import type { ExamPeriod, SchoolYear, StudyData } from '@/types/study';

type StudyDataContextValue = {
  userId: string;
  data: StudyData;
  currentSchoolYear: SchoolYear | null;
  currentPeriods: ExamPeriod[];
  refresh: () => Promise<void>;
};

const StudyDataContext = createContext<StudyDataContextValue | null>(null);

export function StudyDataProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [data, setData] = useState<StudyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await loadStudyData();
    setData(next);
    setError(null);
  }, []);

  const load = useCallback(() => {
    setError(null);
    refresh().catch((err: unknown) => {
      setError(toUserMessage(err, 'Je gegevens konden niet worden geladen.'));
    });
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const currentSchoolYear = data?.schoolYears[0] ?? null;

  const currentPeriods = useMemo(
    () => (data && currentSchoolYear ? data.examPeriods.filter((period) => period.school_year_id === currentSchoolYear.id) : []),
    [data, currentSchoolYear],
  );

  if (!data) {
    if (error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="max-w-sm text-sm text-neutral-600 dark:text-neutral-300">{error}</p>
          <Button onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Opnieuw proberen
          </Button>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600" aria-label="Gegevens laden" />
      </div>
    );
  }

  const value: StudyDataContextValue = { userId, data, currentSchoolYear, currentPeriods, refresh };

  return <StudyDataContext.Provider value={value}>{children}</StudyDataContext.Provider>;
}

export function useStudyData(): StudyDataContextValue {
  const context = useContext(StudyDataContext);
  if (!context) throw new Error('useStudyData moet binnen StudyDataProvider worden gebruikt.');
  return context;
}
