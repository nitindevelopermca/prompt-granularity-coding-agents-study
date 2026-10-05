import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { login, LoginError } from '../api/authApi';
import { useAuth } from '../context/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { BagIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../components/icons';
import './LoginPage.css';

interface FieldErrors {
  username?: string;
  password?: string;
}

export default function LoginPage() {
  const { setSession } = useAuth();
  useDocumentTitle('MyShop – Login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password;

    const nextFieldErrors: FieldErrors = {};
    if (!trimmedUsername) {
      nextFieldErrors.username = 'Username is required.';
    }
    if (!trimmedPassword) {
      nextFieldErrors.password = 'Password is required.';
    }

    setFieldErrors(nextFieldErrors);
    setFormError(null);

    if (nextFieldErrors.username) {
      usernameInputRef.current?.focus();
      return;
    }
    if (nextFieldErrors.password) {
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await login({ username: trimmedUsername, password: trimmedPassword });
      setSession(response);
      // Navigation to Products happens automatically: App renders ProductsPage
      // once the auth context reports an authenticated session.
    } catch (error) {
      const message =
        error instanceof LoginError
          ? error.message
          : 'Something went wrong while logging in. Please try again.';
      setFormError(message);
      // Move focus to the error so it is announced and reachable via keyboard.
      requestAnimationFrame(() => formErrorRef.current?.focus());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <BagIcon className="login-brand-icon" />
          <span className="login-brand-name">MyShop</span>
        </div>

        <h1 className="login-heading">Welcome Back</h1>
        <p className="login-subheading">Please login to your account</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="username" className="login-label">
              Username
            </label>
            <div className={`login-input-wrapper${fieldErrors.username ? ' login-input-wrapper-error' : ''}`}>
              <UserIcon className="login-input-icon" />
              <input
                ref={usernameInputRef}
                id="username"
                name="username"
                type="text"
                className="login-input"
                placeholder="Enter your username"
                autoComplete="username"
                value={username}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                onChange={(event) => {
                  setUsername(event.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }
                }}
              />
            </div>
            {fieldErrors.username && (
              <p id="username-error" className="login-field-error" role="alert">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <div className={`login-input-wrapper${fieldErrors.password ? ' login-input-wrapper-error' : ''}`}>
              <LockIcon className="login-input-icon" />
              <input
                ref={passwordInputRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
              />
              <button
                type="button"
                className="login-toggle-visibility"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="login-field-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {formError && (
            <div className="login-form-error" role="alert" tabIndex={-1} ref={formErrorRef}>
              {formError}
            </div>
          )}

          <button type="submit" className="login-submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  );
}
