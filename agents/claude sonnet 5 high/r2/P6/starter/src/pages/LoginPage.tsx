import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/dummyjson'
import { BagIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../components/icons'
import styles from './LoginPage.module.css'

interface FieldErrors {
  username?: string
  password?: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const usernameErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()

  useEffect(() => {
    document.title = 'Log in \u2014 MyShop'
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedUsername = username.trim()
    const trimmedPassword = password

    const nextErrors: FieldErrors = {}
    if (!trimmedUsername) {
      nextErrors.username = 'Username is required.'
    }
    if (!trimmedPassword) {
      nextErrors.password = 'Password is required.'
    }

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

    setLoading(true)
    try {
      await login(trimmedUsername, trimmedPassword)
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.card} aria-labelledby="login-heading">
        <div className={styles.brand} aria-hidden="true">
          <span className={styles.brandIcon}>
            <BagIcon width={22} height={22} />
          </span>
          <span className={styles.brandName}>MyShop</span>
        </div>

        <h1 id="login-heading" className={styles.title}>
          Welcome Back
        </h1>
        <p className={styles.subtitle}>Log in to continue shopping.</p>

        {formError && (
          <div className={`alert alert-error ${styles.formError}`} role="alert" id={formErrorId}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="login-username" className={styles.label}>
              Username
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <UserIcon />
              </span>
              <input
                ref={usernameRef}
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                className={`${styles.input} ${fieldErrors.username ? styles.inputError : ''}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={fieldErrors.username ? true : undefined}
                aria-describedby={fieldErrors.username ? usernameErrorId : undefined}
                disabled={loading}
              />
            </div>
            {fieldErrors.username && (
              <p className={styles.fieldError} id={usernameErrorId} role="alert">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <LockIcon />
              </span>
              <input
                ref={passwordRef}
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`${styles.input} ${styles.passwordInput} ${
                  fieldErrors.password ? styles.inputError : ''
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.toggleVisibility}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className={styles.fieldError} id={passwordErrorId} role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button type="submit" className={`btn btn-primary btn-block ${styles.submit}`} disabled={loading}>
            {loading && <span className="spinner" aria-hidden="true" />}
            <span>{loading ? 'Logging in\u2026' : 'Login'}</span>
          </button>
        </form>

        <p className={styles.hint}>Try username "emilys" and password "emilyspass".</p>
      </main>
    </div>
  )
}
