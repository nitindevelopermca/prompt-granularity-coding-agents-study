import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Header } from './Header'

interface ProtectedRouteProps {
  children: ReactNode
}

/** Authenticated app shell: shared header + main landmark, guarded by session. */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell">
      <Header />
      <main id="main-content" className="app-main">
        {children}
      </main>
    </div>
  )
}
