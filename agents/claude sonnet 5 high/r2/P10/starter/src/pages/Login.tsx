import { useState, type FormEvent } from 'react'
import { login as loginApi, ApiError } from '../api'
import { useAuth } from '../context/AuthContext'

interface LoginPageProps {
  onSuccess: () => void
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const nextFieldErrors: { username?: string; password?: string } = {}
    if (!username.trim()) nextFieldErrors.username = 'Username is required.'
    if (!password) nextFieldErrors.password = 'Password is required.'
    setFieldErrors(nextFieldErrors)
    setFormError(null)

    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    setLoading(true)
    try {
      const result = await loginApi(username.trim(), password)
      login({ id: result.id, username: result.username, accessToken: result.accessToken })
      onSuccess()
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
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <span className="login-card__bag" aria-hidden="true">
            🛍️
          </span>
          <span className="login-card__logo">MyShop</span>
        </div>
        <h1 className="login-card__title">Welcome Back</h1>
        <p className="login-card__subtitle">Sign in to continue shopping</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <div className="form-field__input-wrap">
              <span className="form-field__icon" aria-hidden="true">
                👤
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={fieldErrors.username ? 'true' : undefined}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
              />
            </div>
            {fieldErrors.username && (
              <p id="username-error" role="alert" className="form-field__error">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="form-field__input-wrap">
              <span className="form-field__icon" aria-hidden="true">
                🔒
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={fieldErrors.password ? 'true' : undefined}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="form-field__toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" role="alert" className="form-field__error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="login-card__error">
              {formError}
            </p>
          )}

          <button type="submit" className="login-card__submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  )
}
