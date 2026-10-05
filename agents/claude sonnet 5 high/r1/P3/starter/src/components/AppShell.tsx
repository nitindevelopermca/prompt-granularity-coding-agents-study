import type { ReactNode } from 'react'
import AppHeader from './AppHeader'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">{children}</main>
    </div>
  )
}
