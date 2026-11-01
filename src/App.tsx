import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { StudyDataProvider, useStudyData } from '@/contexts/StudyDataContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { AuthPage } from '@/pages/AuthPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SubjectsPage } from '@/pages/SubjectsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AssistantPage } from '@/pages/AssistantPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { FlashcardsPage } from '@/pages/FlashcardsPage';
import { FocusPage } from '@/pages/FocusPage';
import { HelpPage } from '@/pages/HelpPage';
import { MusicPage } from '@/pages/MusicPage';
import { PlannerPage } from '@/pages/PlannerPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { StudyEnvironmentPage } from '@/pages/StudyEnvironmentPage';
import { GradesPage } from '@/pages/GradesPage';
import { NotesPage } from '@/pages/NotesPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { GuidedTour } from '@/components/tour/GuidedTour';
import { useSegments } from '@/lib/router';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent-600" aria-label="Laden" />
    </div>
  );
}

function AppRoutes() {
  const { data } = useStudyData();
  const [page, detail] = useSegments();

  if (!data.profile || page === 'onboarding') return <OnboardingPage />;

  const activePage = page ?? 'dashboard';

  let content: ReactNode;
  if (activePage === 'vakken') {
    content = <SubjectsPage />;
  } else if (activePage === 'instellingen') {
    content = <SettingsPage tab={detail ?? 'profiel'} />;
  } else if (activePage === 'assistent') {
    content = <AssistantPage />;
  } else if (activePage === 'kalender') {
    content = <CalendarPage />;
  } else if (activePage === 'flashcards') {
    content = <FlashcardsPage />;
  } else if (activePage === 'focus') {
    content = <FocusPage />;
  } else if (activePage === 'planner') {
    content = <PlannerPage />;
  } else if (activePage === 'muziek') {
    content = <MusicPage />;
  } else if (activePage === 'hulp') {
    content = <HelpPage />;
  } else if (activePage === 'studieomgeving') {
    content = <StudyEnvironmentPage />;
  } else if (activePage === 'statistieken') {
    content = <StatisticsPage />;
  } else if (activePage === 'cijfers') {
    content = <GradesPage />;
  } else if (activePage === 'notities') {
    content = <NotesPage />;
  } else if (activePage === 'groepen') {
    content = <GroupsPage />;
  } else {
    content = <DashboardPage />;
  }

  return (
    <>
      <AppShell activePage={activePage}>{content}</AppShell>
      {!data.profile.tour_completed && <GuidedTour userId={data.profile.user_id} />}
    </>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (!user) return <AuthPage />;

  return (
    <StudyDataProvider key={user.id} userId={user.id}>
      <AppRoutes />
    </StudyDataProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ToastProvider>
  );
}
