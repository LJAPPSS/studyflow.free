import { useMemo, useState } from 'react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { CalendarMonth } from '@/components/calendar/CalendarMonth';
import { DayAgenda } from '@/components/calendar/DayAgenda';
import { examsByDate, subjectById } from '@/lib/calendar';
import { todayIso } from '@/lib/format';
import type { ExamPeriod } from '@/types/study';

export function CalendarPage() {
  const { data } = useStudyData();
  const [today] = useState(() => todayIso());
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedIso, setSelectedIso] = useState(today);

  const examsMap = useMemo(() => examsByDate(data.exams), [data.exams]);
  const subjects = useMemo(() => subjectById(data.subjects), [data.subjects]);
  const periods = useMemo(() => new Map<string, ExamPeriod>(data.examPeriods.map((period) => [period.id, period])), [data.examPeriods]);

  const shiftMonth = (delta: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const goToToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedIso(today);
  };

  const selectedExams = examsMap.get(selectedIso) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Kalender</h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Je examens en vaste tijden in één overzicht.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <CalendarMonth
          month={month}
          todayIso={today}
          selectedIso={selectedIso}
          examsByDate={examsMap}
          subjects={subjects}
          availability={data.availability}
          onSelect={setSelectedIso}
          onPrevious={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={goToToday}
        />
        <DayAgenda
          iso={selectedIso}
          exams={selectedExams}
          subjects={subjects}
          periods={periods}
          availability={data.availability}
        />
      </div>
    </div>
  );
}
