import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { BagIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon } from '../components/icons'

export function LoginPage() {
  useDocumentMeta(
    'Login – MyShop',
    'Log in to your MyShop account to browse products, read reviews, and manage your cart.',
  )

  const { login, isLoggingIn, loginError, isAuthenticated, clearLoginError } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/products" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearLoginError()

    const trimmedUsername = username.trim()
    let hasError = false

    if (!trimmedUsername) {
      setUsernameError('Username is required.')
      hasError = true
    } else {
      setUsernameError(null)
    }

    if (!password) {
      setPasswordError('Password is required.')
      hasError = true
    } else {
      setPasswordError(null)
    }

    if (hasError) return

    const success = await login(trimmedUsername, password)
    if (success) {
      navigate('/products', { replace: true })
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <BagIcon className="login-brand__icon" />
          <span className="login-brand__name">MyShop</span>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Please login to your account</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <div className="form-input-wrap">
              <UserIcon className="form-input-icon" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-invalid={usernameError ? true : undefined}
                aria-describedby={usernameError ? 'username-error' : undefined}
                disabled={isLoggingIn}
              />
            </div>
            {usernameError && (
              <p id="username-error" className="field-error" role="alert">
                {usernameError}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="form-input-wrap">
              <LockIcon className="form-input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? 'password-error' : undefined}
                disabled={isLoggingIn}
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordError && (
              <p id="password-error" className="field-error" role="alert">
                {passwordError}
              </p>
            )}
          </div>

          <div className="login-forgot-row">
            <a
              href="#"
              className="login-forgot-link"
              aria-disabled="true"
              onClick={(event) => event.preventDefault()}
            >
              Forgot Password?
            </a>
          </div>

          {loginError && (
            <p className="field-error field-error--banner" role="alert">
              {loginError}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={isLoggingIn}>
            {isLoggingIn ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
