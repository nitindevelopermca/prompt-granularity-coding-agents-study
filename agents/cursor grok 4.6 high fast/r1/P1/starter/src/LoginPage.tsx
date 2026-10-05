import { useId, useState, type FormEvent } from 'react'
import { useAuth } from './auth'
import { BagIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from './icons'

type FieldErrors = {
  username?: string
  password?: string
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: FieldErrors = {}
    if (!username.trim()) {
      nextErrors.username = 'Username is required'
    }
    if (!password) {
      nextErrors.password = 'Password is required'
    }
    setFieldErrors(nextErrors)
    setFormError('')
    if (nextErrors.username || nextErrors.password) {
      return
    }

    setLoading(true)
    try {
      await login(username.trim(), password)
      window.location.hash = '/products'
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <main className="login-main">
        <section className="login-card" aria-labelledby="login-heading">
          <div className="login-brand">
            <BagIcon className="login-bag" />
            <p className="brand-name">MyShop</p>
          </div>
          <h1 id="login-heading">Welcome Back</h1>
          <p className="login-lead">Please login to your account</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <p className="form-error" id={formErrorId} role="alert">
                {formError}
              </p>
            ) : null}

            <div className="field">
              <label htmlFor={usernameId}>Username</label>
              <div className="input-wrap">
                <UserIcon className="input-icon" />
                <input
                  id={usernameId}
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={fieldErrors.username ? true : undefined}
                  aria-describedby={fieldErrors.username ? usernameErrorId : undefined}
                  disabled={loading}
                />
              </div>
              {fieldErrors.username ? (
                <p className="field-error" id={usernameErrorId} role="alert">
                  {fieldErrors.username}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor={passwordId}>Password</label>
              <div className="input-wrap">
                <LockIcon className="input-icon" />
                <input
                  id={passwordId}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowPassword((open) => !open)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOffIcon className="input-icon" /> : <EyeIcon className="input-icon" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="field-error" id={passwordErrorId} role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
