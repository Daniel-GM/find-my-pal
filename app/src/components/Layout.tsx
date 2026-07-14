import type { ReactNode } from 'react';
import Navbar from './Navbar';
import type { AppState } from '@/hooks/useAppState';

interface LayoutProps {
  children: ReactNode;
  appState: AppState;
}

export default function Layout({ children, appState }: LayoutProps) {
  return (
    <div
      className={appState.theme === 'dark' ? 'dark' : 'light'}
      style={{
        minHeight: '100dvh',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar appState={appState} />
      <main
        style={{
          marginLeft: 280,
          minHeight: '100dvh',
          backgroundColor: 'var(--bg-base)',
          transition: 'background-color 0.3s ease',
        }}
      >
        {children}
      </main>
    </div>
  );
}
