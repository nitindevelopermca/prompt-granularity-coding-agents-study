// Login screen.
// UX: spec/ux/ux-design-of-login.png
// API: spec/apis_contract/01_Login_API_Contract.docx, spec/SPEC_FREEZE.md
//
// Scope for this work unit: username/password login only. Forgot Password
// and signup are explicitly out of scope and intentionally omitted.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, LoginError, LOGIN_ERROR_MESSAGES } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { BagIcon, EyeIcon, EyeOffIcon, LockIcon, SpinnerIcon, UserIcon } from '../components/icons';
import styles from './LoginPage.module.css';

interface FieldErrors {
  username?: string;
  password?: string;
}

function validate(username: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!username.trim()) {
    errors.username = 'Username is required.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }
  return errors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: setAuthenticatedUser } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    document.title = 'Login – MyShop';
  }, []);

  // Move focus to the form-level error so assistive tech announces it and
  // keyboard users land somewhere meaningful after a failed submission.
  useEffect(() => {
    if (formError) {
      alertRef.current?.focus();
    }
  }, [formError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(username, password);
    setFieldErrors(validationErrors);
    setFormError(null);

    if (validationErrors.username) {
      usernameRef.current?.focus();
      return;
    }
    if (validationErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login({ username: username.trim(), password });
      setAuthenticatedUser(data);
      navigate('/products', { replace: true });
    } catch (error) {
      if (error instanceof LoginError) {
        setFormError(error.message);
      } else {
        setFormError(LOGIN_ERROR_MESSAGES.unexpected);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.brand}>
          <BagIcon />
          <p className={styles.brandName}>MyShop</p>
        </div>

        <h1 className={styles.heading}>Welcome Back</h1>
        <p className={styles.subtitle}>Please login to your account</p>

        {formError ? (
          <p className={styles.alert} role="alert" tabIndex={-1} ref={alertRef}>
            {formError}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <UserIcon />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                className={`${styles.input} ${fieldErrors.username ? styles.inputError : ''}`}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                ref={usernameRef}
                aria-invalid={fieldErrors.username ? true : undefined}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.username ? (
              <p className={styles.fieldError} id="username-error">
                {fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <LockIcon />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`${styles.input} ${styles.passwordInput} ${
                  fieldErrors.password ? styles.inputError : ''
                }`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                ref={passwordRef}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={styles.toggleVisibility}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className={styles.fieldError} id="password-error">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <button type="submit" className={styles.submit} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? (
              <>
                <SpinnerIcon className={styles.spinner} />
                <span>Logging in…</span>
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
