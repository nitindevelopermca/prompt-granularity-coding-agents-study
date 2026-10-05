import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { LoginError, loginWithPassword } from '../api/login'
import { useAuth } from '../auth/AuthContext'

function BagMark() {
  return (
    <svg className="login-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M10 12V10.5a6 6 0 0 1 12 0V12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="7" y="12" width="18" height="15" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 12v2.2a2.5 2.5 0 0 0 5 0V12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.8 18.4c.9-3 3.3-4.6 6.2-4.6s5.3 1.6 6.2 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.2" y="10.5" width="11.6" height="8.3" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.6 10.5V8.4a3.4 3.4 0 0 1 6.8 0v2.1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.5 12s3.2-6 8.5-6 8.5 6 8.5 6-3.2 6-8.5 6-8.5-6-8.5-6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      {off ? <path d="M5 19 19 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /> : null}
    </svg>
  )
}

export default function LoginPage() {
  const { setSession } = useAuth()
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const formErrorRef = useRef<HTMLParagraphElement>(null)
  const usernameErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'MyShop — Sign in'
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedUsername = username.trim()
    const nextUsernameError = trimmedUsername ? '' : 'Enter your username.'
    const nextPasswordError = password ? '' : 'Enter your password.'

    setUsernameError(nextUsernameError)
    setPasswordError(nextPasswordError)
    setFormError('')

    if (nextUsernameError || nextPasswordError) {
      if (nextUsernameError) {
        usernameRef.current?.focus()
      } else {
        passwordRef.current?.focus()
      }
      return
    }

    setIsSubmitting(true)

    try {
      const session = await loginWithPassword(trimmedUsername, password)
      setSession(session)
    } catch (error) {
      const message =
        error instanceof LoginError ? error.message : 'Login failed. Please try again.'
      setFormError(message)
      requestAnimationFrame(() => {
        formErrorRef.current?.focus()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-brand">
          <BagMark />
          <p className="login-brand-name">MyShop</p>
        </div>

        <h1 id="login-heading" className="login-title">
          Welcome Back
        </h1>
        <p className="login-subtitle">Please login to your account</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <div className="sr-only" aria-live="polite">
            {isSubmitting ? 'Logging in' : ''}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="username">
              Username
            </label>
            <div className="field-control">
              <UserIcon />
              <input
                ref={usernameRef}
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Enter your username"
                value={username}
                disabled={isSubmitting}
                aria-invalid={Boolean(usernameError)}
                aria-describedby={usernameError ? usernameErrorId : undefined}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (usernameError) {
                    setUsernameError('')
                  }
                  if (formError) {
                    setFormError('')
                  }
                }}
              />
            </div>
            {usernameError ? (
              <p id={usernameErrorId} className="field-error" role="alert">
                {usernameError}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <div className="field-control">
              <LockIcon />
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                disabled={isSubmitting}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? passwordErrorId : undefined}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (passwordError) {
                    setPasswordError('')
                  }
                  if (formError) {
                    setFormError('')
                  }
                }}
              />
              <button
                type="button"
                className="field-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
            {passwordError ? (
              <p id={passwordErrorId} className="field-error" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p
              ref={formErrorRef}
              id={formErrorId}
              className="form-error"
              role="alert"
              tabIndex={-1}
            >
              {formError}
            </p>
          ) : null}

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}
