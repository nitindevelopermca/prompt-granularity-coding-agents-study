import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { InvalidCredentialsError, NetworkError } from '../auth/loginApi'
import './LoginPage.css'

type FieldErrors = {
  username?: string
  password?: string
}

function BagMark() {
  return (
    <svg className="login-brand-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M14 18h20l-1.6 20.2A3 3 0 0 1 29.41 41H18.59a3 3 0 0 1-2.99-2.8L14 18Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M18 18v-3.5a6 6 0 0 1 12 0V18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="login-field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.2 19.2a6.8 6.8 0 0 1 13.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="login-field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="10.5" width="12" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 10.5V8.2a3.5 3.5 0 0 1 7 0v2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg className="login-field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.8 12s3.6-6.2 9.2-6.2S21.2 12 21.2 12 17.6 18.2 12 18.2 2.8 12 2.8 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {off ? (
        <path d="M4 20 20 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : null}
    </svg>
  )
}

export default function LoginPage() {
  const { signIn } = useAuth()
  const usernameId = useId()
  const passwordId = useId()
  const usernameErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()

  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Login | MyShop'
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors = {}
    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      nextErrors.username = 'Enter your username.'
    }
    if (!password) {
      nextErrors.password = 'Enter your password.'
    }

    setFieldErrors(nextErrors)
    setFormError(null)

    if (nextErrors.username || nextErrors.password) {
      const firstInvalid = nextErrors.username ? usernameRef.current : passwordRef.current
      firstInvalid?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await signIn(trimmedUsername, password)
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        setFormError(error.message)
      } else if (error instanceof NetworkError) {
        setFormError(error.message)
      } else {
        setFormError('Unable to sign in right now. Please try again.')
      }
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

        <h1 id="login-heading">Welcome Back</h1>
        <p className="login-instruction">Please login to your account</p>

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
          aria-describedby={formError ? formErrorId : undefined}
        >
          <div className="login-field">
            <label htmlFor={usernameId}>Username</label>
            <div className="login-input-wrap">
              <UserIcon />
              <input
                ref={usernameRef}
                id={usernameId}
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                disabled={isSubmitting}
                aria-invalid={fieldErrors.username ? true : undefined}
                aria-describedby={fieldErrors.username ? usernameErrorId : undefined}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (fieldErrors.username) {
                    setFieldErrors((current) => ({ ...current, username: undefined }))
                  }
                }}
              />
            </div>
            {fieldErrors.username ? (
              <p id={usernameErrorId} className="login-field-error">
                {fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div className="login-field">
            <label htmlFor={passwordId}>Password</label>
            <div className="login-input-wrap">
              <LockIcon />
              <input
                ref={passwordRef}
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                disabled={isSubmitting}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((current) => ({ ...current, password: undefined }))
                  }
                }}
              />
              <button
                type="button"
                className="login-visibility"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
            {fieldErrors.password ? (
              <p id={passwordErrorId} className="login-field-error">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p id={formErrorId} className="login-form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <button className="login-submit" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}
