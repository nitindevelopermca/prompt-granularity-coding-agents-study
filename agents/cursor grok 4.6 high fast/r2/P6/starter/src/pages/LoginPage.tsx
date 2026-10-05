import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { navigate } from '../app/navigation'
import { useAuth } from '../auth/AuthContext'
import {
  InvalidCredentialsError,
  LoginRequestError,
  NetworkError,
} from '../auth/types'
import './LoginPage.css'

function BagMark() {
  return (
    <svg className="login-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.2 8.2h9.6l-.85 11.1a1.6 1.6 0 0 1-1.6 1.48H9.65a1.6 1.6 0 0 1-1.6-1.48L7.2 8.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 8.2V7.15a2.9 2.9 0 0 1 5.8 0V8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.6 18.4c1.15-3.05 3.1-4.4 6.4-4.4s5.25 1.35 6.4 4.4"
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
      <rect
        x="6.4"
        y="10.4"
        width="11.2"
        height="8.4"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8.6 10.4V8.3a3.4 3.4 0 0 1 6.8 0v2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 12s2.8-5.2 8-5.2S20 12 20 12s-2.8 5.2-8 5.2S4 12 4 12Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M5 19 19 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 12s2.8-5.2 8-5.2S20 12 20 12s-2.8 5.2-8 5.2S4 12 4 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function LoginPage() {
  const { login } = useAuth()
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const formErrorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    document.title = 'MyShop — Sign in'
  }, [])

  useEffect(() => {
    if (formError) {
      formErrorRef.current?.focus()
    }
  }, [formError])

  function validate(): boolean {
    const nextUsernameError = username.trim() ? '' : 'Enter your username.'
    const nextPasswordError = password ? '' : 'Enter your password.'
    setUsernameError(nextUsernameError)
    setPasswordError(nextPasswordError)

    if (nextUsernameError) {
      usernameRef.current?.focus()
      return false
    }

    if (nextPasswordError) {
      passwordRef.current?.focus()
      return false
    }

    return true
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      await login(username.trim(), password)
      navigate('/products', { replace: true })
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        setFormError(error.message)
      } else if (error instanceof NetworkError) {
        setFormError(error.message)
      } else if (error instanceof LoginRequestError) {
        setFormError(error.message)
      } else {
        setFormError('Unable to sign in. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <main className="login-card">
        <div className="login-brand">
          <BagMark />
          <p className="login-brand-name">MyShop</p>
        </div>

        <header className="login-header">
          <h1>Welcome Back</h1>
          <p>Please login to your account</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <div className="field">
            <label htmlFor={usernameId}>Username</label>
            <div className={`field-control${usernameError ? ' is-invalid' : ''}`}>
              <UserIcon />
              <input
                ref={usernameRef}
                id={usernameId}
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (usernameError) setUsernameError('')
                }}
                disabled={isSubmitting}
                aria-invalid={usernameError ? true : undefined}
                aria-describedby={usernameError ? usernameErrorId : undefined}
              />
            </div>
            {usernameError ? (
              <p className="field-error" id={usernameErrorId} role="alert">
                {usernameError}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor={passwordId}>Password</label>
            <div className={`field-control${passwordError ? ' is-invalid' : ''}`}>
              <LockIcon />
              <input
                ref={passwordRef}
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (passwordError) setPasswordError('')
                }}
                disabled={isSubmitting}
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? passwordErrorId : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
            {passwordError ? (
              <p className="field-error" id={passwordErrorId} role="alert">
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
            {isSubmitting ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
