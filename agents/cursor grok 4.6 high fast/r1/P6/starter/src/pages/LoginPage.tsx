import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { LoginRequestError } from '../api/login'
import { useAuth } from '../auth/AuthContext'
import { BagMark, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../components/Icons'
import './LoginPage.css'

interface LoginPageProps {
  onSuccess: () => void
}

interface FieldErrors {
  username?: string
  password?: string
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { signIn } = useAuth()
  const usernameId = useId()
  const passwordId = useId()
  const formErrorId = useId()
  const usernameErrorId = useId()
  const passwordErrorId = useId()

  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Login · MyShop'
  }, [])

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!username.trim()) {
      next.username = 'Enter your username.'
    }
    if (!password) {
      next.password = 'Enter your password.'
    }
    return next
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const nextErrors = validate()
    setFieldErrors(nextErrors)
    setFormError(null)

    if (nextErrors.username) {
      usernameRef.current?.focus()
      return
    }
    if (nextErrors.password) {
      passwordRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await signIn(username.trim(), password)
      onSuccess()
    } catch (error) {
      if (error instanceof LoginRequestError) {
        setFormError(error.message)
      } else {
        setFormError('Unable to sign in. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-brand">
          <span className="login-mark" aria-hidden="true">
            <BagMark className="login-mark-icon" />
          </span>
          <p className="login-brand-name">MyShop</p>
        </div>

        <h1 id="login-heading">Welcome Back</h1>
        <p className="login-instruction">Please login to your account</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          {formError ? (
            <p id={formErrorId} className="login-form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="login-field">
            <label htmlFor={usernameId}>Username</label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">
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
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={
                  fieldErrors.username
                    ? usernameErrorId
                    : formError
                      ? formErrorId
                      : undefined
                }
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (fieldErrors.username || formError) {
                    setFieldErrors((current) => ({ ...current, username: undefined }))
                    setFormError(null)
                  }
                }}
              />
            </div>
            {fieldErrors.username ? (
              <p id={usernameErrorId} className="login-field-error" role="alert">
                {fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div className="login-field">
            <label htmlFor={passwordId}>Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">
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
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password
                    ? passwordErrorId
                    : formError
                      ? formErrorId
                      : undefined
                }
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password || formError) {
                    setFieldErrors((current) => ({ ...current, password: undefined }))
                    setFormError(null)
                  }
                }}
              />
              <button
                type="button"
                className="login-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p id={passwordErrorId} className="login-field-error" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}
