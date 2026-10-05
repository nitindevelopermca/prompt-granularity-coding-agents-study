// Username/password login. UX: spec/ux/ux-design-of-login.png.
// Forgot Password and signup are explicitly out of scope and are omitted.

import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../router/Router';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { BagIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../components/Icons';

type FieldErrors = {
  username?: string;
  password?: string;
};

export default function LoginPage() {
  useDocumentMeta('Login | MyShop', 'Log in to your MyShop account to browse products and manage your cart.');

  const { login, isLoading, error, clearError } = useAuth();
  const { navigate } = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const usernameId = useId();
  const passwordId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    const nextFieldErrors: FieldErrors = {};
    if (!username.trim()) nextFieldErrors.username = 'Username is required.';
    if (!password) nextFieldErrors.password = 'Password is required.';
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    try {
      await login(username.trim(), password);
      navigate('/products');
    } catch {
      // Failure message is surfaced via the auth context's `error` state.
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <BagIcon className="login-brand__icon" aria-hidden="true" />
          <span className="login-brand__name">MyShop</span>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Please login to your account</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="form-alert" role="alert">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor={usernameId}>Username</label>
            <div className="input-with-icon">
              <UserIcon className="input-icon" aria-hidden="true" />
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
                disabled={isLoading}
              />
            </div>
            {fieldErrors.username && (
              <p className="field-error" id={usernameErrorId} role="alert">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={passwordId}>Password</label>
            <div className="input-with-icon">
              <LockIcon className="input-icon" aria-hidden="true" />
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
                disabled={isLoading}
              />
              <button
                type="button"
                className="input-icon-button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isLoading}
              >
                {showPassword ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="field-error" id={passwordErrorId} role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  );
}
