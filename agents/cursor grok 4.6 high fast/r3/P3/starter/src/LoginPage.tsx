import { useId, useRef, useState, type FormEvent } from 'react'
import { loginWithPassword } from './api/auth'
import { BrandMark } from './BrandMark'
import { navigate } from './navigation'
import { useAuth } from './session'

export function LoginPage() {
  const { setSession } = useAuth()
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const formErrorRef = useRef<HTMLParagraphElement>(null)

  const usernameId = useId()
  const passwordId = useId()
  const usernameErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedUsername = username.trim()
    const nextUsernameError = trimmedUsername ? '' : 'Enter a username.'
    const nextPasswordError = password ? '' : 'Enter a password.'

    setUsernameError(nextUsernameError)
    setPasswordError(nextPasswordError)
    setFormError('')

    if (nextUsernameError || nextPasswordError) {
      const firstInvalid = nextUsernameError ? usernameRef.current : passwordRef.current
      firstInvalid?.focus()
      return
    }

    setSubmitting(true)
    const result = await loginWithPassword(trimmedUsername, password)
    setSubmitting(false)

    if (!result.ok) {
      setFormError(result.message)
      if (result.kind === 'invalid') {
        passwordRef.current?.focus()
      } else {
        queueMicrotask(() => formErrorRef.current?.focus())
      }
      return
    }

    setSession(result.session)
    navigate('/products', true)
  }

  return (
    <div className="login-page">
      <main className="login-main">
        <section className="login-card" aria-labelledby="login-heading">
          <BrandMark size="login" />
          <h1 id="login-heading">Welcome Back</h1>
          <p className="login-lead">Enter your username and password to sign in to MyShop.</p>

          <form className="login-form" onSubmit={onSubmit} noValidate aria-busy={submitting}>
            <p
              ref={formErrorRef}
              id={formErrorId}
              className="form-alert"
              role="alert"
              tabIndex={-1}
              hidden={!formError}
            >
              {formError}
            </p>

            <div className="field">
              <label htmlFor={usernameId}>Username</label>
              <div className="field-control">
                <span className="field-icon" aria-hidden="true">
                  <UserIcon />
                </span>
                <input
                  ref={usernameRef}
                  id={usernameId}
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  disabled={submitting}
                  aria-invalid={usernameError ? true : undefined}
                  aria-describedby={usernameError ? usernameErrorId : undefined}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    if (usernameError) setUsernameError('')
                    if (formError) setFormError('')
                  }}
                />
              </div>
              {usernameError ? (
                <p id={usernameErrorId} className="field-error">
                  {usernameError}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor={passwordId}>Password</label>
              <div className="field-control">
                <span className="field-icon" aria-hidden="true">
                  <LockIcon />
                </span>
                <input
                  ref={passwordRef}
                  id={passwordId}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  disabled={submitting}
                  className="has-trailing"
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={passwordError ? passwordErrorId : undefined}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (passwordError) setPasswordError('')
                    if (formError) setFormError('')
                  }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordError ? (
                <p id={passwordErrorId} className="field-error">
                  {passwordError}
                </p>
              ) : null}
            </div>

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Login'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.5 18.2c.9-3 3.1-4.7 6.5-4.7s5.6 1.7 6.5 4.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="10" width="12" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 12s3.2-6 8.5-6 8.5 6 8.5 6-3.2 6-8.5 6-8.5-6-8.5-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5.5 19.5 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M10.2 6.2A8.6 8.6 0 0 1 12 6c5.3 0 8.5 6 8.5 6a14 14 0 0 1-3.2 3.9M7.2 8.3C4.9 9.8 3.5 12 3.5 12s3.2 6 8.5 6c1.2 0 2.3-.3 3.3-.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}
