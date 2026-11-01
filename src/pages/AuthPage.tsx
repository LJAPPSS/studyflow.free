import { useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, CalendarCheck, GraduationCap, Sparkles } from 'lucide-react';
import { AuthHeroShapes } from '@/components/auth/AuthHeroShapes';
import { TestLabPanel, isTestLabLogin } from '@/components/auth/TestLabPanel';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { signInWithPassword, signUpWithPassword, validateCredentials } from '@/lib/auth';

type Mode = 'login' | 'signup';

const HIGHLIGHTS = [
  { icon: BookOpen, text: 'Al je vakken en examens overzichtelijk op een plek' },
  { icon: CalendarCheck, text: 'Een studieplan voor al je vakken in een kalender' },
  { icon: Sparkles, text: 'Een AI-studieassistent die je vragen over je vakken beantwoordt' },
];

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testLabOpen, setTestLabOpen] = useState(false);

  const isSignup = mode === 'signup';

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup');
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSignup && isTestLabLogin(email, password)) {
      setTestLabOpen(true);
      return;
    }

    const validationError = validateCredentials(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    if (isSignup) {
      const result = await signUpWithPassword(email, password);
      if (result.error) setError(result.error);
      else if (result.needsConfirmation) setNotice('Je account is aangemaakt. Controleer je e-mail om je account te bevestigen.');
    } else {
      const message = await signInWithPassword(email, password);
      if (message) setError(message);
    }
    setSubmitting(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r-[3px] border-outline bg-panel p-12 text-ink lg:flex lg:flex-col lg:justify-between">
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-outline bg-accent-600 shadow-hard-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">StudyFlow</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">Slim studeren voor al je examens.</h1>
          <p className="mt-5 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
            StudyFlow brengt je leerstof, planning en studiehulp samen op een plek, zodat je precies weet wat je wanneer moet doen.
          </p>
          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-semibold text-ink">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-outline bg-selection shadow-hard-sm">
                  <Icon className="h-4 w-4 text-accent-700 dark:text-accent-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <AuthHeroShapes />
        </div>
        <p className="relative text-xs text-neutral-600">StudyFlow is gratis te gebruiken voor leerlingen.</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-outline bg-accent-600 shadow-hard-sm">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">StudyFlow</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-ink">
            {isSignup ? 'Maak een account aan' : 'Welkom terug'}
          </h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {isSignup ? 'Je studieomgeving wordt persoonlijk ingericht na het registreren.' : 'Log in om verder te gaan met studeren.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <Field label="E-mailadres" htmlFor="auth-email">
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="naam@voorbeeld.be"
                required
              />
            </Field>
            <Field label="Wachtwoord" htmlFor="auth-password" hint={isSignup ? 'Minstens 8 tekens.' : undefined}>
              <input
                id="auth-password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                required
              />
            </Field>

            {error && (
              <p role="alert" className="rounded-playful border-2 border-error-600 bg-error-50 px-4 py-3 text-sm font-semibold text-error-700 dark:bg-error-600/15 dark:text-error-300">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-playful border-2 border-fresh-600 bg-fresh-50 px-4 py-3 text-sm font-semibold text-fresh-800 dark:bg-fresh-600/15 dark:text-fresh-200">
                {notice}
              </p>
            )}

            <Button type="submit" loading={submitting} className="w-full" size="md">
              {isSignup ? 'Account aanmaken' : 'Inloggen'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {isSignup ? 'Heb je al een account?' : 'Nog geen account?'}{' '}
            <button type="button" onClick={switchMode} className="font-semibold text-accent-600 underline decoration-2 underline-offset-4 hover:text-accent-500 dark:text-accent-300">
              {isSignup ? 'Inloggen' : 'Registreren'}
            </button>
          </p>
        </div>
      </main>

      <TestLabPanel open={testLabOpen} onClose={() => setTestLabOpen(false)} />
    </div>
  );
}
