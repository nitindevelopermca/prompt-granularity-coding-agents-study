import { useState, type FormEvent } from 'react'
import { errorMessage } from './api'
import { useAuth } from './auth'
import { BagIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from './icons'

type LoginPageProps = {
  onSuccess: () => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextUsernameError = username.trim() ? '' : 'Enter your username.'
    const nextPasswordError = password ? '' : 'Enter your password.'
    setUsernameError(nextUsernameError)
    setPasswordError(nextPasswordError)
    setFormError('')

    if (nextUsernameError || nextPasswordError) return

    setSubmitting(true)
    try {
      await signIn(username.trim(), password)
      onSuccess()
    } catch (error) {
      setFormError(errorMessage(error, 'Unable to sign in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <main className="login-main">
        <section className="login-card" aria-labelledby="login-heading">
          <div className="login-brand">
            <span className="brand-mark" aria-hidden="true">
              <BagIcon className="icon-lg" />
            </span>
            <p className="brand-name">MyShop</p>
          </div>
          <h1 id="login-heading">Welcome Back</h1>
          <p className="login-lead">Please login to your account</p>
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="username">Username</label>
              <div className="field-control">
                <UserIcon className="field-icon" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    if (usernameError) setUsernameError('')
                  }}
                  aria-invalid={usernameError ? true : undefined}
                  aria-describedby={usernameError ? 'username-error' : undefined}
                  disabled={submitting}
                />
              </div>
              {usernameError ? (
                <p id="username-error" className="field-error" role="alert">
                  {usernameError}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="field-control">
                <LockIcon className="field-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (passwordError) setPasswordError('')
                  }}
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="icon-button field-action"
                  onClick={() => setShowPassword((open) => !open)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOffIcon className="icon-sm" /> : <EyeIcon className="icon-sm" />}
                </button>
              </div>
              {passwordError ? (
                <p id="password-error" className="field-error" role="alert">
                  {passwordError}
                </p>
              ) : null}
            </div>
            {formError ? (
              <p className="form-error" role="alert">
                {formError}
              </p>
            ) : null}
            <button className="button-primary button-full" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
