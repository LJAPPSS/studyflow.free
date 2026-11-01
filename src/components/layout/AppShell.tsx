import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Sidebar, useSidebarState } from '@/components/layout/Sidebar';
import { GlobalSearch, MobileMenuButton } from '@/components/layout/GlobalSearch';

type AppShellProps = {
  activePage: string;
  children: ReactNode;
};

export function AppShell({ activePage, children }: AppShellProps) {
  const sidebar = useSidebarState();

  return (
    <div className="min-h-screen">
      <Sidebar
        activePage={activePage}
        collapsed={sidebar.collapsed}
        onToggleCollapsed={sidebar.toggleCollapsed}
        mobileOpen={sidebar.mobileOpen}
        onCloseMobile={sidebar.closeMobile}
      />
      <div className={cn('transition-[padding] duration-300 ease-out', sidebar.collapsed ? 'lg:pl-[104px]' : 'lg:pl-[284px]')}>
        <header className="sticky top-0 z-20 bg-ground border-b-2 border-rule-muted">
          <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-10">
            <MobileMenuButton onClick={sidebar.openMobile} />
            <GlobalSearch />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl animate-fade-in px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
