import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { I18nProvider } from '@/i18n';
import { useAppState } from '@/hooks/useAppState';
import { decodeTeam, parseShareHash, teamFromHash } from '@/lib/team-share';
import type { SharedTeam as SharedTeamData } from '@/lib/team-share';
import { resolveShortLink } from '@/lib/share-links';
import { getPublication } from '@/lib/community';
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

type SharedState = SharedTeamData | 'invalid' | 'loading' | null;

function initialSharedState(): SharedState {
  const parsed = parseShareHash(window.location.hash);
  if (!parsed) return null;
  if (parsed.kind === 'full') return teamFromHash(window.location.hash) ?? 'invalid';
  return 'loading';
}

async function resolveSharedFromHash(hash: string): Promise<SharedTeamData | 'invalid' | null> {
  const parsed = parseShareHash(hash);
  if (!parsed) return null;
  if (parsed.kind === 'full') return teamFromHash(hash) ?? 'invalid';

  if (parsed.kind === 'short') {
    return (await resolveShortLink(parsed.value)) ?? 'invalid';
  }

  const publication = await getPublication(parsed.value);
  return publication ? (decodeTeam(publication.teamData) ?? 'invalid') : 'invalid';
}

export default function App() {
  const appState = useAppState();
  const [shared, setShared] = useState<SharedState>(initialSharedState);

  useEffect(() => {
    let requestId = 0;

    const loadShared = (hash: string) => {
      requestId += 1;
      const currentRequestId = requestId;
      const parsed = parseShareHash(hash);
      if (!parsed) {
        setShared(null);
        return;
      }
      if (parsed.kind === 'full') {
        setShared(teamFromHash(hash) ?? 'invalid');
        return;
      }

      setShared('loading');
      void resolveSharedFromHash(hash)
        .then((result) => {
          if (currentRequestId !== requestId || window.location.hash !== hash) return;
          setShared(result ?? 'invalid');
        })
        .catch(() => {
          if (currentRequestId !== requestId || window.location.hash !== hash) return;
          setShared('invalid');
        });
    };

    loadShared(window.location.hash);
    const onHashChange = () => loadShared(window.location.hash);
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
            team={shared === 'invalid' || shared === 'loading' ? null : shared}
            loading={shared === 'loading'}
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
