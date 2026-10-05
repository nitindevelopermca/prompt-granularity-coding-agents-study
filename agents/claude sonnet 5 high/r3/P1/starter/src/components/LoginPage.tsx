import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import { usePageMeta } from '../hooks/usePageMeta.ts'
import { BagIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from './icons.tsx'

interface FieldErrors {
  username?: string
  password?: string
}

export function LoginPage() {
  usePageMeta(
    'Login | MyShop',
    'Sign in to MyShop to browse products, read reviews, and manage your cart.',
  )

  const { login, isLoggingIn, loginError, clearLoginError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearLoginError()

    const errors: FieldErrors = {}
    if (!username.trim()) errors.username = 'Username is required.'
    if (!password) errors.password = 'Password is required.'
    setFieldErrors(errors)

    if (errors.username || errors.password) return

    await login(username.trim(), password)
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <BagIcon size={40} />
          <span>MyShop</span>
        </div>
        <h1>Welcome Back</h1>
        <p className="login-card__subtitle">Please login to your account</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="login-username">Username</label>
            <div className="input-with-icon">
              <span className="input-with-icon__leading">
                <UserIcon />
              </span>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? 'login-username-error' : undefined}
              />
            </div>
            {fieldErrors.username && (
              <p id="login-username-error" role="alert" className="form-error">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <span className="input-with-icon__leading">
                <LockIcon />
              </span>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="input-with-icon__trailing"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="login-password-error" role="alert" className="form-error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {loginError && (
            <p role="alert" className="form-error form-error--summary">
              {loginError}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={isLoggingIn}>
            {isLoggingIn ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  )
}
