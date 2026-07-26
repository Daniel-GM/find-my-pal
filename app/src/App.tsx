import { I18nProvider } from '@/i18n';
import { useAppState } from '@/hooks/useAppState';
import Layout from '@/components/Layout';
import Home from './pages/Home';
import Packages from './pages/Packages';
import TeamBuilder from './pages/TeamBuilder';
import Mounts from './pages/Mounts';
import PalsPage from './pages/Pals';
import BossDrops from './pages/BossDrops';
import Builds from './pages/Builds';
import CraftingPlanner from './pages/CraftingPlanner';

export default function App() {
  const appState = useAppState();

  return (
    <I18nProvider>
      <Layout appState={appState}>
        {appState.currentView === 'breeding' && <Home appState={appState} />}
        {appState.currentView === 'packages' && <Packages appState={appState} />}
        {appState.currentView === 'team' && <TeamBuilder appState={appState} />}
        {appState.currentView === 'mounts' && <Mounts />}
        {appState.currentView === 'pals' && <PalsPage />}
        {appState.currentView === 'bossdrops' && <BossDrops />}
        {appState.currentView === 'crafting' && <CraftingPlanner />}
        {appState.currentView === 'builds' && <Builds />}
      </Layout>
    </I18nProvider>
  );
}
