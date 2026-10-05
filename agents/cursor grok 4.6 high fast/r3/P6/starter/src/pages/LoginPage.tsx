import { useEffect, useState, type FormEvent } from 'react'
import { loginWithPassword, LoginRequestError } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import './LoginPage.css'

function BagMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M18 18c0-4.2 2.7-7 6-7s6 2.8 6 7"
        stroke="#2563eb"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect
        x="12"
        y="16.5"
        width="24"
        height="20"
        rx="6"
        stroke="#2563eb"
        strokeWidth="2.2"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.6 18.6c1.3-3 3.5-4.5 6.4-4.5s5.1 1.5 6.4 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="6"
        y="10"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.8 12S6.2 6.5 12 6.5 21.2 12 21.2 12 17.8 17.5 12 17.5 2.8 12 2.8 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9.5 6.8C10.3 6.6 11.1 6.5 12 6.5c5.8 0 9.2 5.5 9.2 5.5a16 16 0 0 1-3.5 4.1M6.4 8.7A16.2 16.2 0 0 0 2.8 12S6.2 17.5 12 17.5c1.2 0 2.3-.2 3.3-.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LoginPage() {
  const { setSession } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Login | MyShop'
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextUsernameError = username.trim() === '' ? 'Username is required.' : ''
    const nextPasswordError = password === '' ? 'Password is required.' : ''

    setUsernameError(nextUsernameError)
    setPasswordError(nextPasswordError)
    setFormError('')

    if (nextUsernameError || nextPasswordError) {
      return
    }

    setLoading(true)
    try {
      const session = await loginWithPassword(username.trim(), password)
      setSession(session)
    } catch (error) {
      if (error instanceof LoginRequestError) {
        setFormError(error.message)
      } else {
        setFormError(
          'A network error occurred. Please check your connection and try again.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <main className="login-card">
        <div className="login-brand">
          <BagMark />
          <p className="login-brand-name">MyShop</p>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Please login to your account</p>

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={loading}
          aria-describedby={formError ? 'login-form-error' : undefined}
        >
          <div className="sr-only" aria-live="polite">
            {loading ? 'Signing in' : ''}
          </div>

          <div className="login-field">
            <label htmlFor="username">Username</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <UserIcon />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                disabled={loading}
                aria-invalid={usernameError !== ''}
                aria-describedby={usernameError ? 'username-error' : undefined}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setUsernameError('')
                  setFormError('')
                }}
              />
            </div>
            {usernameError ? (
              <p id="username-error" className="login-error" role="alert">
                {usernameError}
              </p>
            ) : null}
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                name="password"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                disabled={loading}
                aria-invalid={passwordError !== ''}
                aria-describedby={passwordError ? 'password-error' : undefined}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setPasswordError('')
                  setFormError('')
                }}
              />
              <button
                type="button"
                className="login-visibility"
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={passwordVisible}
                disabled={loading}
                onClick={() => setPasswordVisible((visible) => !visible)}
              >
                {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordError ? (
              <p id="password-error" className="login-error" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p id="login-form-error" className="login-error login-form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </main>
    </div>
  )
}
