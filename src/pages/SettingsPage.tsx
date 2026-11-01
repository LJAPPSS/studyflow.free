import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CalendarDays, Clock, Moon, Sun, UserRound, Palette, Shapes, Monitor, Trash2, type LucideIcon } from 'lucide-react';
import { useStudyData } from '@/contexts/StudyDataContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field, inputClass } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { SchoolYearPanel } from '@/components/settings/SchoolYearPanel';
import { AvailabilityPanel } from '@/components/settings/AvailabilityPanel';
import { cn } from '@/lib/cn';
import { SCHOOL_LEVELS } from '@/lib/constants';
import { toUserMessage } from '@/lib/errors';
import { navigate } from '@/lib/router';
import { applyStyle, applyTheme, getStoredStyle, getStoredTheme, type DesignStyle, type Theme } from '@/lib/theme';
import { deleteAccount } from '@/services/account';
import { saveProfile } from '@/services/profile';

const TABS = [
  { id: 'profiel', label: 'Profiel', icon: UserRound },
  { id: 'schooljaar', label: 'Schooljaar', icon: CalendarDays },
  { id: 'beschikbaarheid', label: 'Beschikbaarheid', icon: Clock },
  { id: 'weergave', label: 'Weergave', icon: Palette },
] as const;

type TabId = (typeof TABS)[number]['id'];

type SettingsPageProps = { tab: string };

export function SettingsPage({ tab }: SettingsPageProps) {
  const activeTab: TabId = TABS.some((item) => item.id === tab) ? (tab as TabId) : 'profiel';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Instellingen</h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Beheer je profiel, schooljaar, studietijd en weergave.</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <nav aria-label="Instellingen" className="flex gap-1 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeTab === item.id ? 'page' : undefined}
              onClick={() => navigate(`/instellingen/${item.id}`)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97]',
                activeTab === item.id
                  ? 'border-[3px] border-outline bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500'
                  : 'border-[3px] border-transparent text-neutral-700 hover:translate-x-1 hover:border-outline hover:bg-panel hover:text-ink dark:text-neutral-300 dark:hover:bg-neutral-800',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {activeTab === 'profiel' && (
            <div className="space-y-8">
              <ProfilePanel />
              <DeleteAccountPanel />
            </div>
          )}
          {activeTab === 'schooljaar' && <SchoolYearPanel />}
          {activeTab === 'beschikbaarheid' && <AvailabilityPanel />}
          {activeTab === 'weergave' && <AppearancePanel />}
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="card sm:!p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ProfilePanel() {
  const { userId, data, refresh } = useStudyData();
  const { show } = useToast();
  const profile = data.profile;
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [schoolLevel, setSchoolLevel] = useState<string>(profile?.school_level ?? SCHOOL_LEVELS[0]);
  const [schoolGrade, setSchoolGrade] = useState<number>(profile?.school_grade ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setSchoolLevel(profile?.school_level ?? SCHOOL_LEVELS[0]);
    setSchoolGrade(profile?.school_grade ?? 1);
  }, [profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayName.trim()) {
      setError('Vul je naam of bijnaam in.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveProfile(userId, { display_name: displayName, school_level: schoolLevel, school_grade: schoolGrade });
      await refresh();
      show('Profiel opgeslagen.');
    } catch (err) {
      setError(toUserMessage(err, 'Je profiel kon niet worden opgeslagen.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard title="Profiel" description="Hoe StudyFlow je aanspreekt en op welk niveau je zit.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Naam of bijnaam" htmlFor="profile-name" error={error}>
          <input id="profile-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} className={inputClass} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Onderwijsniveau" htmlFor="profile-level">
            <select id="profile-level" value={schoolLevel} onChange={(event) => setSchoolLevel(event.target.value)} className={inputClass}>
              {SCHOOL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Leerjaar" htmlFor="profile-grade">
            <select id="profile-grade" value={schoolGrade} onChange={(event) => setSchoolGrade(Number(event.target.value))} className={inputClass}>
              {[1, 2, 3, 4, 5, 6].map((grade) => (
                <option key={grade} value={grade}>
                  Leerjaar {grade}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving}>
            Opslaan
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}

function DeleteAccountPanel() {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
    } catch (err) {
      setError(toUserMessage(err, 'Je account kon niet worden verwijderd. Probeer het later opnieuw.'));
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <SettingsCard title="Account verwijderen" description="Je account en al je gegevens (vakken, examens, planning, flashcards en afspeellijsten) worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt.">
      {error && <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end">
        <Button variant="danger" onClick={() => setOpen(true)}>
          <Trash2 className="h-4 w-4" />
          Account verwijderen
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        title="Account definitief verwijderen?"
        description="Al je gegevens worden permanent verwijderd. Je kunt daarna niet meer inloggen met dit account."
        confirmLabel="Ja, verwijder mijn account"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setOpen(false)}
      />
    </SettingsCard>
  );
}

function AppearancePanel() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [style, setStyle] = useState<DesignStyle>(getStoredStyle);

  const themeOptions: ChoiceOption<Theme>[] = [
    { value: 'light', label: 'Licht', description: 'Heldere achtergrond, ideaal overdag', icon: Sun, iconClass: 'bg-pastel-sand text-amber-600' },
    { value: 'dark', label: 'Donker', description: 'Rustig voor het oog bij weinig licht', icon: Moon, iconClass: 'bg-neutral-900 text-amber-300' },
  ];

  const styleOptions: ChoiceOption<DesignStyle>[] = [
    { value: 'playful', label: 'Speels geometrisch', description: 'Zachte hoeken, vrolijke kleuren en harde schaduwen', icon: Shapes, iconClass: 'bg-pastel-lavender text-accent-600' },
    { value: 'retro', label: 'Retro', description: 'Grijze vensters met harde randen en heldere kleuren', icon: Monitor, iconClass: 'bg-pastel-sky text-neutral-800' },
  ];

  return (
    <div className="space-y-8">
      <SettingsCard title="Thema" description="Kies licht of donker. Je keuze wordt onthouden op dit apparaat.">
        <ChoiceGroup
          label="Thema"
          options={themeOptions}
          value={theme}
          onChange={(next) => {
            applyTheme(next);
            setTheme(next);
          }}
        />
      </SettingsCard>
      <SettingsCard title="Stijl" description="Kies de vormgeving van StudyFlow. Ook deze keuze wordt onthouden op dit apparaat.">
        <ChoiceGroup
          label="Stijl"
          options={styleOptions}
          value={style}
          onChange={(next) => {
            applyStyle(next);
            setStyle(next);
          }}
        />
      </SettingsCard>
    </div>
  );
}

type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
};

function ChoiceGroup<T extends string>({ label, options, value, onChange }: { label: string; options: ChoiceOption<T>[]; value: T; onChange: (next: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-4 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'group flex items-start gap-4 rounded-playful border-[3px] p-5 text-left transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px]',
            value === option.value
              ? 'border-outline bg-selection shadow-hard dark:bg-neutral-800'
              : 'border-outline bg-panel shadow-hard-sm hover:shadow-hard dark:bg-neutral-900',
          )}
        >
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6', option.iconClass)}>
            <option.icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-medium text-neutral-900 dark:text-neutral-100">{option.label}</span>
            <span className="mt-0.5 block text-sm text-neutral-500 dark:text-neutral-400">{option.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
