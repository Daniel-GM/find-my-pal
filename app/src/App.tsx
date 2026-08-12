import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { I18nProvider } from '@/i18n';
import { useAppState } from '@/hooks/useAppState';
import { teamFromHash } from '@/lib/team-share';
import type { SharedTeam as SharedTeamData } from '@/lib/team-share';
import Layout from '@/components/Layout';
import CookieConsent from '@/components/CookieConsent';
import Home from './pages/Home';
import Packages from './pages/Packages';
import TeamBuilder from './pages/TeamBuilder';
import SharedTeam from './pages/SharedTeam';
import Mounts from './pages/Mounts';
import PalsPage from './pages/Pals';
import BossDrops from './pages/BossDrops';
import CommunityTeams from './pages/CommunityTeams';
import Profile from './pages/Profile';
import CraftingPlanner from './pages/CraftingPlanner';
import Privacy from './pages/Privacy';
import About from './pages/About';

// 'invalid' = the URL carried a #team= hash that could not be decoded.
type SharedState = SharedTeamData | 'invalid' | null;

function readSharedFromHash(): SharedState {
  const { hash } = window.location;
  if (!hash.startsWith('#team=')) return null;
  return teamFromHash(hash) ?? 'invalid';
}

export default function App() {
  const appState = useAppState();
  const [shared, setShared] = useState<SharedState>(readSharedFromHash);

  useEffect(() => {
    const onHashChange = () => setShared(readSharedFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const clearShared = () => {
    // replaceState does not fire hashchange, so update the state directly.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setShared(null);
  };

  return (
    <I18nProvider>
      <Layout appState={appState}>
        {shared ? (
          <SharedTeam
            appState={appState}
            team={shared === 'invalid' ? null : shared}
            onClose={clearShared}
          />
        ) : (
          <>
            {appState.currentView === 'breeding' && <Home appState={appState} />}
            {appState.currentView === 'packages' && <Packages appState={appState} />}
            {appState.currentView === 'team' && <TeamBuilder appState={appState} />}
            {appState.currentView === 'mounts' && <Mounts />}
            {appState.currentView === 'pals' && <PalsPage />}
            {appState.currentView === 'bossdrops' && <BossDrops />}
            {appState.currentView === 'crafting' && <CraftingPlanner />}
            {appState.currentView === 'community' && <CommunityTeams appState={appState} />}
            {appState.currentView === 'profile' && <Profile appState={appState} />}
            {appState.currentView === 'privacy' && <Privacy />}
            {appState.currentView === 'about' && <About />}
          </>
        )}
      </Layout>
      <CookieConsent />
      <Toaster position="bottom-right" richColors />
    </I18nProvider>
  );
}
