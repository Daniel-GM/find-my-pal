import type { ReactNode } from 'react';
import Navbar from './Navbar';
import type { AppState } from '@/hooks/useAppState';
import { useTranslation } from '@/i18n';

interface LayoutProps {
  children: ReactNode;
  appState: AppState;
}

export default function Layout({ children, appState }: LayoutProps) {
  const { t } = useTranslation();

  const linkStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontSize: 12,
    color: 'var(--text-secondary)',
    textDecoration: 'underline',
  } as const;

  return (
    <div
      className={`app-shell ${appState.theme === 'dark' ? 'dark' : 'light'}`}
      style={{
        minHeight: '100dvh',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar appState={appState} />
      <main
        className="app-main"
        style={{
          marginLeft: 280,
          minHeight: '100dvh',
          backgroundColor: 'var(--bg-base)',
          transition: 'background-color 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="app-content" style={{ flex: 1 }}>{children}</div>
        <footer
          className="app-footer flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <button style={linkStyle} onClick={() => appState.setView('about')}>
            {t('footer.about')}
          </button>
          <button style={linkStyle} onClick={() => appState.setView('privacy')}>
            {t('footer.privacy')}
          </button>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {t('footer.disclaimer')}
          </span>
        </footer>
      </main>
    </div>
  );
}
