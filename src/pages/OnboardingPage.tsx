import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, GraduationCap, Plus, Trash2, UserRound, CalendarDays, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { toUserMessage } from '@/lib/errors';
import { navigate } from '@/lib/router';
import { SCHOOL_LEVELS, SUBJECT_COLORS, SUBJECT_COLOR_KEYS, SUGGESTED_SUBJECT_NAMES, DEFAULT_EXAM_PERIOD_NAMES, WEEKDAYS, pickSubjectColor, type SubjectColorKey } from '@/lib/constants';
import { createSubject, createExam } from '@/services/subjects';
import { createSchoolYear } from '@/services/schoolYears';
import { saveProfile, setOnboardingCompleted } from '@/services/profile';
import { createAvailabilityBlock } from '@/services/availability';
import { todayIso } from '@/lib/format';

const STEPS = [
  { id: 'profiel', label: 'Profiel', icon: UserRound },
  { id: 'vakken', label: 'Vakken', icon: BookOpen },
  { id: 'examens', label: 'Examens', icon: CalendarDays },
  { id: 'beschikbaarheid', label: 'Studietijd', icon: Clock },
] as const;

type StepId = (typeof STEPS)[number]['id'];

type DraftSubject = { key: string; name: string; color: SubjectColorKey; difficulty: number; confidence: number };
type DraftExam = { key: string; subjectKey: string; date: string; startTime: string; duration: number };
type DraftBlock = { key: string; weekday: number; start: string; end: string; label: string };

const DURATIONS = [30, 45, 60, 90, 120, 150, 180];
const RATINGS = [1, 2, 3, 4, 5] as const;

function newKey(): string {
  return crypto.randomUUID();
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
      <div className="grid grid-cols-5 gap-1.5">
        {RATINGS.map((rating) => (
          <button
            key={rating}
            type="button"
            aria-pressed={value === rating}
            onClick={() => onChange(rating)}
            className={cn(
              'h-9 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95',
              value === rating
                ? 'border-[3px] border-outline bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500'
                : 'border-[3px] border-outline bg-panel text-neutral-700 hover:bg-selection hover:shadow-hard-sm dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
            )}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: StepId }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);
  return (
    <ol className="flex items-center gap-2" aria-label="Voortgang">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-outline text-xs font-bold transition-[background-color,box-shadow] duration-[180ms]',
                done && 'bg-fresh-300 text-ink',
                active && 'bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500',
                !done && !active && 'bg-panel text-neutral-600 dark:text-neutral-300',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={cn('hidden text-sm font-semibold sm:inline', active ? 'text-ink' : 'text-neutral-600 dark:text-neutral-300')}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && <span className={cn('h-[3px] flex-1 rounded-full', done ? 'bg-outline' : 'bg-rule-muted')} />}
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingPage() {
  const { user } = useAuth();
  const { data, refresh } = useStudyData();
  const { show } = useToast();
  const [step, setStep] = useState<StepId>('profiel');

  const [displayName, setDisplayName] = useState(data.profile?.display_name ?? '');
  const [schoolLevel, setSchoolLevel] = useState<string>(data.profile?.school_level ?? SCHOOL_LEVELS[0]);
  const [schoolGrade, setSchoolGrade] = useState<number>(data.profile?.school_grade ?? 1);
  const [schoolYearLabel, setSchoolYearLabel] = useState(defaultSchoolYearLabel());
  const [periodNames, setPeriodNames] = useState<string[]>(DEFAULT_EXAM_PERIOD_NAMES);
  const [newPeriodName, setNewPeriodName] = useState('');

  const [subjects, setSubjects] = useState<DraftSubject[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [exams, setExams] = useState<DraftExam[]>([]);
  const [blocks, setBlocks] = useState<DraftBlock[]>([]);
  const [blockDay, setBlockDay] = useState(0);
  const [blockStart, setBlockStart] = useState('16:00');
  const [blockEnd, setBlockEnd] = useState('18:00');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stepIndex = STEPS.findIndex((item) => item.id === step);

  const addSubject = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.length > 80) {
      setError('De naam van het vak is te lang (maximaal 80 tekens).');
      return;
    }
    if (subjects.some((subject) => subject.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Dit vak staat al in de lijst.');
      return;
    }
    const color = pickSubjectColor(trimmed, subjects.map((subject) => subject.color));
    setSubjects((current) => [...current, { key: newKey(), name: trimmed, color, difficulty: 3, confidence: 3 }]);
    setSubjectName('');
    setError(null);
  };

  const updateSubject = (key: string, patch: Partial<DraftSubject>) => {
    setSubjects((current) => current.map((subject) => (subject.key === key ? { ...subject, ...patch } : subject)));
  };

  const removeSubject = (key: string) => {
    setSubjects((current) => current.filter((subject) => subject.key !== key));
    setExams((current) => current.filter((exam) => exam.subjectKey !== key));
  };

  const addExam = () => {
    const firstSubject = subjects[0];
    if (!firstSubject) return;
    setExams((current) => [...current, { key: newKey(), subjectKey: firstSubject.key, date: '', startTime: '', duration: 90 }]);
  };

  const updateExam = (key: string, patch: Partial<DraftExam>) => {
    setExams((current) => current.map((exam) => (exam.key === key ? { ...exam, ...patch } : exam)));
  };

  const addBlock = () => {
    if (!blockStart || !blockEnd || blockEnd <= blockStart) {
      setError('De eindtijd moet na de begintijd liggen.');
      return;
    }
    setBlocks((current) => [...current, { key: newKey(), weekday: blockDay, start: blockStart, end: blockEnd, label: 'Studietijd' }]);
    setError(null);
  };

  const addPeriod = () => {
    const trimmed = newPeriodName.trim();
    if (!trimmed) return;
    if (periodNames.some((name) => name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Deze examenperiode staat al in de lijst.');
      return;
    }
    setPeriodNames((current) => [...current, trimmed]);
    setNewPeriodName('');
    setError(null);
  };

  const validateStep = (): string | null => {
    if (step === 'profiel') {
      if (!displayName.trim()) return 'Vul je naam of bijnaam in.';
      if (!schoolYearLabel.trim()) return 'Vul het schooljaar in, bv. 2025-2026.';
    }
    if (step === 'examens') {
      const invalid = exams.find((exam) => !exam.date);
      if (invalid) return 'Vul bij elk examen een datum in, of verwijder het.';
    }
    return null;
  };

  const goNext = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  };

  const goBack = () => {
    setError(null);
    const previous = STEPS[stepIndex - 1];
    if (previous) setStep(previous.id);
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfile(user.id, {
        display_name: displayName,
        school_level: schoolLevel,
        school_grade: schoolGrade,
      });

      const schoolYear = data.schoolYears[0] ?? (await createSchoolYear(schoolYearLabel, periodNames));

      const subjectIds = new Map<string, string>();
      for (const draft of subjects) {
        const existing = data.subjects.find((subject) => subject.name.toLowerCase() === draft.name.toLowerCase());
        if (existing) {
          subjectIds.set(draft.key, existing.id);
          continue;
        }
        const id = await createSubject({
          name: draft.name,
          color: draft.color,
          difficulty: draft.difficulty,
          confidence: draft.confidence,
        });
        subjectIds.set(draft.key, id);
      }

      for (const exam of exams) {
        const subjectId = subjectIds.get(exam.subjectKey);
        if (!subjectId) continue;
        await createExam({
          subject_id: subjectId,
          exam_period_id: null,
          exam_date: exam.date,
          start_time: exam.startTime || null,
          duration_minutes: exam.duration,
          title: null,
        });
      }

      for (const block of blocks) {
        await createAvailabilityBlock({
          kind: 'studietijd',
          weekday: block.weekday,
          specific_date: null,
          start_time: block.start,
          end_time: block.end,
          label: block.label,
        });
      }

      await setOnboardingCompleted(user.id, true);
      await refresh();
      show('Je studieomgeving is klaar.');
      navigate('/dashboard');
    } catch (err) {
      setError(toUserMessage(err, 'Je gegevens konden niet worden opgeslagen. Probeer het opnieuw.'));
    } finally {
      setSaving(false);
    }
  };

  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border-outline bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">StudyFlow</span>
          </div>
          <StepIndicator current={step} />
        </div>

        <section className="card sm:!p-8">
          {step === 'profiel' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Welkom bij StudyFlow</h1>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Vertel kort iets over jezelf. Je kunt dit later altijd aanpassen.</p>
              </div>
              <Field label="Naam of bijnaam" htmlFor="ob-name">
                <input id="ob-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} className={inputClass} autoComplete="given-name" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Onderwijsniveau" htmlFor="ob-level">
                  <select id="ob-level" value={schoolLevel} onChange={(event) => setSchoolLevel(event.target.value)} className={inputClass}>
                    {SCHOOL_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Leerjaar" htmlFor="ob-grade">
                  <select id="ob-grade" value={schoolGrade} onChange={(event) => setSchoolGrade(Number(event.target.value))} className={inputClass}>
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <option key={grade} value={grade}>
                        Leerjaar {grade}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Schooljaar" htmlFor="ob-year" hint="Bijvoorbeeld 2025-2026">
                <input id="ob-year" value={schoolYearLabel} onChange={(event) => setSchoolYearLabel(event.target.value)} maxLength={20} className={inputClass} />
              </Field>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Examenperiodes</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Je kunt deze periodes later altijd aanpassen in je instellingen.</p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {periodNames.map((name) => (
                    <li key={name} className="flex items-center gap-1.5 rounded-full bg-neutral-100 py-1 pl-3 pr-1 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                      {name}
                      <button
                        type="button"
                        aria-label={`${name} verwijderen`}
                        onClick={() => setPeriodNames((current) => current.filter((item) => item !== name))}
                        className="rounded-full p-1 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input
                    value={newPeriodName}
                    onChange={(event) => setNewPeriodName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addPeriod();
                      }
                    }}
                    placeholder="Eigen periode, bv. Herkansingen"
                    maxLength={60}
                    aria-label="Naam van een nieuwe examenperiode"
                    className={inputClass}
                  />
                  <Button variant="secondary" onClick={addPeriod} className="shrink-0">
                    <Plus className="h-4 w-4" />
                    Toevoegen
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'vakken' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Je vakken</h1>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  Voeg de vakken toe waarvoor je examens hebt. Dit kan ook later.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SUBJECT_NAMES.filter((name) => !subjects.some((subject) => subject.name === name)).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => addSubject(name)}
                    className="rounded-full border-2 border-outline bg-panel px-3.5 py-1.5 text-sm font-semibold text-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-[180ms] ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-selection hover:shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  >
                    + {name}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addSubject(subjectName);
                    }
                  }}
                  placeholder="Ander vak, bv. Economie"
                  aria-label="Naam van een vak"
                  maxLength={80}
                  className={inputClass}
                />
                <Button variant="secondary" onClick={() => addSubject(subjectName)} className="shrink-0">
                  <Plus className="h-4 w-4" />
                  Toevoegen
                </Button>
              </div>

              {subjects.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  Nog geen vakken toegevoegd.
                </p>
              ) : (
                <ul className="space-y-3">
                  {subjects.map((subject) => (
                    <li key={subject.key} className="space-y-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/60">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={cn('h-3 w-3 rounded-full', SUBJECT_COLORS[subject.color].dot)} />
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">{subject.name}</span>
                        </div>
                        <button
                          type="button"
                          aria-label={`${subject.name} verwijderen`}
                          onClick={() => removeSubject(subject.key)}
                          className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-600/15 dark:hover:text-error-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kleur">
                        {SUBJECT_COLOR_KEYS.map((key) => (
                          <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={subject.color === key}
                            aria-label={SUBJECT_COLORS[key].label}
                            onClick={() => updateSubject(subject.key, { color: key })}
                            className={cn(
                              'h-6 w-6 rounded-full transition hover:scale-110',
                              SUBJECT_COLORS[key].dot,
                              subject.color === key ? 'ring-2 ring-neutral-900 ring-offset-2 ring-offset-white dark:ring-neutral-100 dark:ring-offset-neutral-900' : '',
                            )}
                          />
                        ))}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <RatingRow label="Moeilijkheid" value={subject.difficulty} onChange={(value) => updateSubject(subject.key, { difficulty: value })} />
                        <RatingRow label="Zelfvertrouwen" value={subject.confidence} onChange={(value) => updateSubject(subject.key, { confidence: value })} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === 'examens' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Je examens</h1>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  Voeg de datums toe die je al kent. Je kunt er later altijd nog bij.
                </p>
              </div>

              {subjects.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  Ga terug en voeg eerst een vak toe. Of sla deze stap over.
                </p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {exams.map((exam) => (
                      <li key={exam.key} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 sm:grid-cols-[1.2fr_1fr_0.8fr_0.9fr_auto] sm:items-end dark:bg-neutral-800/60">
                        <Field label="Vak" htmlFor={`exam-subject-${exam.key}`}>
                          <select id={`exam-subject-${exam.key}`} value={exam.subjectKey} onChange={(event) => updateExam(exam.key, { subjectKey: event.target.value })} className={inputClass}>
                            {subjects.map((subject) => (
                              <option key={subject.key} value={subject.key}>
                                {subject.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Datum" htmlFor={`exam-date-${exam.key}`}>
                          <input id={`exam-date-${exam.key}`} type="date" min={todayIso()} value={exam.date} onChange={(event) => updateExam(exam.key, { date: event.target.value })} className={inputClass} />
                        </Field>
                        <Field label="Uur" htmlFor={`exam-time-${exam.key}`}>
                          <input id={`exam-time-${exam.key}`} type="time" value={exam.startTime} onChange={(event) => updateExam(exam.key, { startTime: event.target.value })} className={inputClass} />
                        </Field>
                        <Field label="Duur" htmlFor={`exam-duration-${exam.key}`}>
                          <select id={`exam-duration-${exam.key}`} value={exam.duration} onChange={(event) => updateExam(exam.key, { duration: Number(event.target.value) })} className={inputClass}>
                            {DURATIONS.map((minutes) => (
                              <option key={minutes} value={minutes}>
                                {minutes} min
                              </option>
                            ))}
                          </select>
                        </Field>
                        <button
                          type="button"
                          aria-label="Examen verwijderen"
                          onClick={() => setExams((current) => current.filter((item) => item.key !== exam.key))}
                          className="justify-self-start rounded-lg p-2.5 text-neutral-500 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-600/15 dark:hover:text-error-300 sm:justify-self-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Button variant="secondary" onClick={addExam}>
                    <Plus className="h-4 w-4" />
                    Examen toevoegen
                  </Button>
                </>
              )}
            </div>
          )}

          {step === 'beschikbaarheid' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Wanneer kun je studeren?</h1>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  Voeg vaste studiemomenten toe per weekdag. Je kunt later meer blokken en verplichtingen instellen.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_0.8fr_auto] sm:items-end">
                <Field label="Dag" htmlFor="block-day">
                  <select id="block-day" value={blockDay} onChange={(event) => setBlockDay(Number(event.target.value))} className={inputClass}>
                    {WEEKDAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Van" htmlFor="block-start">
                  <input id="block-start" type="time" value={blockStart} onChange={(event) => setBlockStart(event.target.value)} className={inputClass} />
                </Field>
                <Field label="Tot" htmlFor="block-end">
                  <input id="block-end" type="time" value={blockEnd} onChange={(event) => setBlockEnd(event.target.value)} className={inputClass} />
                </Field>
                <Button variant="secondary" onClick={addBlock}>
                  <Plus className="h-4 w-4" />
                  Toevoegen
                </Button>
              </div>
              {blocks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  Nog geen studietijd ingesteld. Deze stap mag je ook overslaan.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                  {blocks.map((block) => (
                    <li key={block.key} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="text-sm text-neutral-800 dark:text-neutral-200">
                        {WEEKDAYS[block.weekday].label} · {block.start} tot {block.end}
                      </span>
                      <button
                        type="button"
                        aria-label="Studietijd verwijderen"
                        onClick={() => setBlocks((current) => current.filter((item) => item.key !== block.key))}
                        className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-600/15 dark:hover:text-error-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-6 rounded-playful bg-error-50 px-4 py-3 text-sm font-semibold text-error-700 dark:bg-error-600/15 dark:text-error-300">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-neutral-100 pt-6 dark:border-neutral-800">
            <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0 || saving}>
              <ArrowLeft className="h-4 w-4" />
              Terug
            </Button>
            <div className="flex items-center gap-2">
              {step !== 'profiel' && !isLast && (
                <Button variant="ghost" onClick={goNext} disabled={saving}>
                  Overslaan
                </Button>
              )}
              {isLast ? (
                <Button onClick={finish} loading={saving}>
                  <Check className="h-4 w-4" />
                  Afronden
                </Button>
              ) : (
                <Button onClick={goNext}>
                  Volgende
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function defaultSchoolYearLabel(): string {
  const now = new Date();
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}
