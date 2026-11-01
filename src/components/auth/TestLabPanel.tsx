import { useEffect, useState, type ReactNode } from 'react';
import { Eye, Gauge, Inbox, Monitor, Moon, RotateCcw, Shapes, Sun, Wrench } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { applyStyle, applyTheme, getStoredStyle, getStoredTheme, resetDisplayPreferences, type DesignStyle, type Theme } from '@/lib/theme';

const TESTLAB_EMAIL = 'WOEF';
const TESTLAB_PASSWORD = 'W8Woord';
const BULK_TOAST_COUNT = 5;
const SLOW_ACTION_MS = 2500;
const LONG_LIST_LENGTH = 400;

export function isTestLabLogin(email: string, password: string): boolean {
  return email === TESTLAB_EMAIL && password === TESTLAB_PASSWORD;
}

type TestLabPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function TestLabPanel({ open, onClose }: TestLabPanelProps) {
  const [displayVersion, setDisplayVersion] = useState(0);

  return (
    <Modal open={open} onClose={onClose} title="Testlab" description="Testtools voor dit apparaat. Ze raken geen accountgegevens in de database aan." size="lg" footer={<Button onClick={onClose}>Sluiten</Button>}>
      <div className="space-y-8">
        <DisplaySection key={displayVersion} />
        <FeedbackSection />
        <StatePreviewSection />
        <LongListSection />
        <StorageSection onReset={() => setDisplayVersion((version) => version + 1)} />
      </div>
    </Modal>
  );
}

function PanelSection({ icon: Icon, title, children }: { icon: typeof Sun; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function DisplaySection() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [style, setStyle] = useState<DesignStyle>(getStoredStyle);
  const viewport = useViewportSize();

  return (
    <>
      <PanelSection icon={Shapes} title="Stijl">
        <div className="grid grid-cols-2 gap-3">
          <ToggleButton
            active={style === 'playful'}
            onClick={() => {
              applyStyle('playful');
              setStyle('playful');
            }}
            icon={Shapes}
            label="Speels"
          />
          <ToggleButton
            active={style === 'retro'}
            onClick={() => {
              applyStyle('retro');
              setStyle('retro');
            }}
            icon={Monitor}
            label="Retro"
          />
        </div>
      </PanelSection>
      <PanelSection icon={Wrench} title="Thema">
        <div className="grid grid-cols-2 gap-3">
          <ToggleButton
            active={theme === 'light'}
            onClick={() => {
              applyTheme('light');
              setTheme('light');
            }}
            icon={Sun}
            label="Licht"
          />
          <ToggleButton
            active={theme === 'dark'}
            onClick={() => {
              applyTheme('dark');
              setTheme('dark');
            }}
            icon={Moon}
            label="Donker"
          />
        </div>
      </PanelSection>
      <PanelSection icon={Gauge} title="Schermgrootte">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {viewport.width} x {viewport.height} px, {breakpointLabel(viewport.width)}
        </p>
      </PanelSection>
    </>
  );
}

function FeedbackSection() {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  const runSlowAction = () => {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      show('Vertraagde actie is klaar.');
    }, SLOW_ACTION_MS);
  };

  return (
    <PanelSection icon={Gauge} title="Meldingen en acties">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            for (let index = 1; index <= BULK_TOAST_COUNT; index += 1) show(`Testmelding ${index} van ${BULK_TOAST_COUNT}.`);
          }}
        >
          Meerdere meldingen
        </Button>
        <Button variant="secondary" onClick={() => show('Testfout: dit is een voorbeeldmelding.', 'error')}>
          Foutmelding
        </Button>
        <Button variant="secondary" loading={busy} onClick={runSlowAction}>
          Trage actie
        </Button>
      </div>
    </PanelSection>
  );
}

function StatePreviewSection() {
  return (
    <PanelSection icon={Eye} title="Visuele statussen">
      <div className="space-y-4">
        <EmptyState icon={Inbox} title="Nog niets om te tonen" description="Voorbeeld van een lege lijst." />
        <p role="alert" className="rounded-playful border-2 border-error-600 bg-error-50 px-4 py-3 text-sm font-semibold text-error-700 dark:bg-error-600/15 dark:text-error-300">
          Voorbeeld van een foutmelding.
        </p>
        <div className="space-y-2" aria-hidden="true">
          <div className="h-4 w-2/3 animate-soft-pulse rounded-xl bg-rule-muted" />
          <div className="h-4 w-1/2 animate-soft-pulse rounded-xl bg-rule-muted" />
        </div>
      </div>
    </PanelSection>
  );
}

function LongListSection() {
  const [visible, setVisible] = useState(false);

  return (
    <PanelSection icon={Gauge} title="Lange lijst">
      <Button variant="secondary" onClick={() => setVisible((current) => !current)} aria-expanded={visible}>
        {visible ? 'Lijst verbergen' : `Lijst met ${LONG_LIST_LENGTH} items tonen`}
      </Button>
      {visible && (
        <ol className="max-h-56 space-y-1 overflow-y-auto rounded-playful border-2 border-outline bg-field-soft p-3 text-sm text-ink">
          {Array.from({ length: LONG_LIST_LENGTH }, (_, index) => (
            <li key={index} className="flex justify-between gap-3 border-b border-rule-muted py-1 last:border-b-0">
              <span>Item {index + 1}</span>
              <span className="text-neutral-600 dark:text-neutral-300">{(index * 37) % 100}%</span>
            </li>
          ))}
        </ol>
      )}
    </PanelSection>
  );
}

function StorageSection({ onReset }: { onReset: () => void }) {
  const { show } = useToast();

  const reset = () => {
    resetDisplayPreferences();
    onReset();
    show('Weergave-instellingen teruggezet.');
  };

  return (
    <PanelSection icon={RotateCcw} title="Opslag">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">Zet alleen de stijl- en thema-keuze op dit apparaat terug naar de standaard. Je inlogsessie blijft behouden.</p>
      <Button variant="secondary" onClick={reset}>
        Weergave resetten
      </Button>
    </PanelSection>
  );
}

function useViewportSize() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

function breakpointLabel(width: number): string {
  if (width < 640) return 'mobiel';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function ToggleButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Sun; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-playful border-[3px] border-outline px-4 py-3 text-sm font-semibold text-ink transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px]',
        active ? 'bg-selection shadow-hard' : 'bg-panel shadow-hard-sm hover:shadow-hard',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
