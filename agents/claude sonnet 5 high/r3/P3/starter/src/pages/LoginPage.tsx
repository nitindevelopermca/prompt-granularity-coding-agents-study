import { useId, useState, type FormEvent } from 'react'
import { login } from '../api/auth'
import { toErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import { useRouter } from '../router'
import { usePageMeta } from '../hooks/usePageMeta'
import { BagIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../components/icons'
import './LoginPage.css'

interface FieldErrors {
  username?: string
  password?: string
}

export function LoginPage() {
  usePageMeta(
    'Login — MyShop',
    'Log in to your MyShop account to browse products, manage your cart, and check out.',
  )

  const { setUser } = useAuth()
  const { navigate } = useRouter()

  const usernameId = useId()
  const passwordId = useId()
  const formErrorId = useId()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    const errors: FieldErrors = {}
    if (!username.trim()) errors.username = 'Username is required.'
    if (!password) errors.password = 'Password is required.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const user = await login({ username: username.trim(), password })
      setUser(user)
      navigate('/products', { replace: true })
    } catch (error) {
      setFormError(toErrorMessage(error, 'Something went wrong. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <BagIcon className="login-brand__icon" />
          <span className="login-brand__name">MyShop</span>
        </div>

        <h1 id="login-heading" className="login-title">
          Welcome Back
        </h1>
        <p className="login-subtitle">Please login to your account</p>

        <form noValidate onSubmit={handleSubmit}>
          {formError && (
            <p id={formErrorId} className="login-form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="login-field">
            <label htmlFor={usernameId} className="login-label">
              Username
            </label>
            <div className={fieldErrors.username ? 'login-input-wrap login-input-wrap--error' : 'login-input-wrap'}>
              <UserIcon className="login-input-icon" />
              <input
                id={usernameId}
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                className="login-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-invalid={fieldErrors.username ? true : undefined}
                aria-describedby={fieldErrors.username ? `${usernameId}-error` : undefined}
              />
            </div>
            {fieldErrors.username && (
              <p id={`${usernameId}-error`} className="login-field-error" role="alert">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor={passwordId} className="login-label">
              Password
            </label>
            <div className={fieldErrors.password ? 'login-input-wrap login-input-wrap--error' : 'login-input-wrap'}>
              <LockIcon className="login-input-icon" />
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="login-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
              />
              <button
                type="button"
                className="login-toggle-password"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id={`${passwordId}-error`} className="login-field-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  )
}
