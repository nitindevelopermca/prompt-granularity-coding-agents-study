// Authenticated application shell: shared header + main landmark, with a
// meaningful per-page document title and meta description.

import type { ReactNode } from 'react';
import Header from './Header';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

type AppShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function AppShell({ title, description, children }: AppShellProps) {
  useDocumentMeta(title, description);

  return (
    <div className="app-shell">
      <Header />
      <main id="main-content" className="app-main">
        {children}
      </main>
    </div>
  );
}
