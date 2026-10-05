import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { login, AuthError } from '../api/auth'
import { toAuthUser, useAuth } from '../context/AuthContext'
import { BagIcon, UserIcon, LockIcon, EyeIcon, EyeOffIcon, AlertIcon } from '../components/Icons'
import './LoginPage.css'

interface FieldErrors {
  username?: string
  password?: string
}

export default function LoginPage() {
  const { setUser } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const usernameInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const usernameId = useId()
  const passwordId = useId()
  const usernameErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()

  useEffect(() => {
    document.title = 'Login - MyShop'
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedUsername = username.trim()
    const nextFieldErrors: FieldErrors = {}
    if (trimmedUsername === '') {
      nextFieldErrors.username = 'Username is required.'
    }
    if (password === '') {
      nextFieldErrors.password = 'Password is required.'
    }

    setFieldErrors(nextFieldErrors)
    setFormError(null)

    if (nextFieldErrors.username) {
      usernameInputRef.current?.focus()
      return
    }
    if (nextFieldErrors.password) {
      passwordInputRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      const response = await login(trimmedUsername, password)
      setUser(toAuthUser(response))
    } catch (error) {
      if (error instanceof AuthError) {
        setFormError(error.message)
      } else if (error instanceof Error) {
        setFormError(error.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <BagIcon width={40} height={40} className="login-brand__icon" />
          <span className="login-brand__name">MyShop</span>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Please login to your account</p>

        {formError && (
          <p id={formErrorId} role="alert" className="inline-alert login-form-error">
            <AlertIcon width={18} height={18} />
            <span>{formError}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor={usernameId}>Username</label>
            <div className={`login-input-wrapper ${fieldErrors.username ? 'login-input-wrapper--invalid' : ''}`}>
              <UserIcon className="login-input-icon" />
              <input
                id={usernameId}
                ref={usernameInputRef}
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? usernameErrorId : undefined}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }))
                  }
                }}
              />
            </div>
            {fieldErrors.username && (
              <p id={usernameErrorId} role="alert" className="login-field-error">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor={passwordId}>Password</label>
            <div className={`login-input-wrapper ${fieldErrors.password ? 'login-input-wrapper--invalid' : ''}`}>
              <LockIcon className="login-input-icon" />
              <input
                id={passwordId}
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }))
                  }
                }}
              />
              <button
                type="button"
                className="login-toggle-visibility"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id={passwordErrorId} role="alert" className="login-field-error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button type="submit" className="primary-button login-submit" disabled={loading} aria-busy={loading}>
            {loading && <span className="spinner" aria-hidden="true" />}
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
