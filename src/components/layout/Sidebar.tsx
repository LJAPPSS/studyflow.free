import { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarClock,
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  GraduationCap,
  Layers,
  LogOut,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardList,
  Music,
  Settings,
  Timer,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { navigate } from '@/lib/router';
import { signOutUser } from '@/lib/auth';
import { toUserMessage } from '@/lib/errors';
import { useStudyData } from '@/contexts/StudyDataContext';
import { useToast } from '@/components/ui/Toast';

type NavItem = { key: string; label: string; icon: LucideIcon; path: string };

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'assistent', label: 'AI-studieassistent', icon: Bot, path: '/assistent' },
  { key: 'planner', label: 'Studieplanner', icon: CalendarClock, path: '/planner' },
  { key: 'kalender', label: 'Kalender', icon: CalendarDays, path: '/kalender' },
  { key: 'flashcards', label: 'Flashcards', icon: Layers, path: '/flashcards' },
  { key: 'focus', label: 'Focus-timer', icon: Timer, path: '/focus' },
  { key: 'muziek', label: 'Studiemuziek', icon: Music, path: '/muziek' },
  { key: 'vakken', label: 'Mijn vakken', icon: BookOpen, path: '/vakken' },
  { key: 'studieomgeving', label: 'Studieomgeving', icon: GraduationCap, path: '/studieomgeving' },
  { key: 'cijfers', label: 'Cijfers', icon: ClipboardList, path: '/cijfers' },
  { key: 'notities', label: 'Notities', icon: NotebookPen, path: '/notities' },
  { key: 'statistieken', label: 'Statistieken', icon: BarChart3, path: '/statistieken' },
  { key: 'groepen', label: 'Studiegroepen', icon: Users, path: '/groepen' },
  { key: 'hulp', label: 'Hulp', icon: CircleHelp, path: '/hulp' },
  { key: 'instellingen', label: 'Instellingen', icon: Settings, path: '/instellingen' },
];

const COLLAPSED_KEY = 'examiq-sidebar-collapsed';

type SidebarProps = {
  activePage: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ activePage, collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { data } = useStudyData();
  const { show } = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const displayName = data.profile?.display_name ?? '';

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
    } catch (error) {
      show(toUserMessage(error, 'Uitloggen is niet gelukt.'), 'error');
      setSigningOut(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-neutral-950/40 transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside
        aria-label="Hoofdnavigatie"
        className={cn(
          'fixed inset-y-3 left-3 z-40 flex flex-col rounded-playful border-[3px] border-outline bg-panel shadow-hard transition-[width,transform] duration-300 ease-out',
          collapsed ? 'w-[76px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className={cn('flex h-20 items-center px-4', collapsed ? 'justify-center' : 'justify-between')}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-3 rounded-2xl"
            aria-label="Naar dashboard"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[3px] border-outline bg-accent-600 shadow-hard-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 group-active:scale-95">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            {!collapsed && <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">StudyFlow</span>}
          </button>
          {!collapsed && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Menu sluiten"
              className="rounded-xl p-1.5 text-neutral-500 transition hover:bg-neutral-100 active:scale-90 lg:hidden dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2 scrollbar-thin">
          {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => {
            const active = activePage === key;
            return (
              <a
                key={key}
                href={`#${path}`}
                onClick={onCloseMobile}
                title={collapsed ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl border-[3px] border-transparent px-3.5 py-3 text-sm font-semibold transition-[transform,background-color,box-shadow] duration-[180ms] ease-out active:scale-[0.97]',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'border-outline bg-accent-600 text-white shadow-hard-sm dark:bg-accent-500'
                    : 'text-neutral-600 hover:translate-x-1 hover:border-outline hover:bg-selection hover:text-ink dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
                )}
              >
                <Icon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
                {!collapsed && <span className="truncate">{label}</span>}
              </a>
            );
          })}
        </nav>

        <div className="p-3">
          {!collapsed && displayName && (
            <p className="mb-2 truncate px-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{displayName}</p>
          )}
          <div className={cn('flex items-center gap-1', collapsed ? 'flex-col' : 'justify-between')}>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 disabled:opacity-60 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              aria-label="Uitloggen"
              title="Uitloggen"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && 'Uitloggen'}
            </button>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Zijbalk uitklappen' : 'Zijbalk inklappen'}
              className="hidden rounded-xl p-2 text-neutral-500 transition-all hover:bg-neutral-100 hover:text-neutral-900 active:scale-90 lg:inline-flex dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  return {
    collapsed,
    toggleCollapsed: () => setCollapsed((value) => !value),
    mobileOpen,
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
  };
}
