import { useId, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from '../context/RouterContext'
import { login, LoginError } from '../lib/authApi'
import { useDocumentMeta } from '../lib/useDocumentMeta'

export default function LoginPage() {
  useDocumentMeta(
    'Login – MyShop',
    'Log in to your MyShop account to browse products, manage your cart, and check out.',
  )

  const { setUserFromLoginResponse } = useAuth()
  const { navigate } = useRouter()

  const usernameId = useId()
  const passwordId = useId()
  const errorId = useId()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedUsername = username.trim()
    const nextFieldErrors: { username?: string; password?: string } = {}
    if (!trimmedUsername) {
      nextFieldErrors.username = 'Username is required.'
    }
    if (!password) {
      nextFieldErrors.password = 'Password is required.'
    }
    setFieldErrors(nextFieldErrors)
    setFormError(null)

    if (nextFieldErrors.username || nextFieldErrors.password) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await login({ username: trimmedUsername, password })
      setUserFromLoginResponse(response)
      navigate('/products')
    } catch (err) {
      if (err instanceof LoginError) {
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <svg
            className="login-brand-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <span className="login-brand-name">MyShop</span>
        </div>

        <h1 id="login-heading" className="login-title">
          Welcome Back
        </h1>
        <p className="login-subtitle">Please login to your account</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div id={errorId} className="form-alert" role="alert">
              {formError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor={usernameId}>Username</label>
            <div className="input-with-icon">
              <svg
                className="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
              </svg>
              <input
                id={usernameId}
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? `${usernameId}-error` : undefined}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.username && (
              <p id={`${usernameId}-error`} className="field-error" role="alert">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={passwordId}>Password</label>
            <div className="input-with-icon">
              <svg
                className="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path strokeLinecap="round" d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="input-trailing-button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            {fieldErrors.password && (
              <p id={`${passwordId}-error`} className="field-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  )
}
