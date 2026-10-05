import { useEffect, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import CartPage from './Cart'
import type { CartItem } from './Cart'
import ProductsPage from './Products'
import type { Product } from './Products'

const LOGIN_URL = 'https://dummyjson.com/auth/login'
const SESSION_KEY = 'myshop-session'

type Session = {
  id: number
  accessToken: string
  username: string
}

type Route = '/products' | '/cart'

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function readSession(): Session | null {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (!saved) return null

    const value = JSON.parse(saved) as Partial<Session>
    if (
      typeof value.id === 'number' &&
      typeof value.accessToken === 'string' &&
      typeof value.username === 'string'
    ) {
      return value as Session
    }
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
  }
  return null
}

function getRoute(): Route {
  return window.location.pathname === '/cart' ? '/cart' : '/products'
}

function Login({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string
    password?: string
  }>({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: { username?: string; password?: string } = {}

    if (!username.trim()) errors.username = 'Enter your username.'
    if (!password) errors.password = 'Enter your password.'

    setFieldErrors(errors)
    setFormError('')
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          expiresInMins: 30,
        }),
      })

      const data = (await response.json()) as {
        id?: unknown
        accessToken?: unknown
        username?: unknown
        message?: unknown
      }

      if (!response.ok) {
        setFormError(
          response.status === 400 && data.message === 'Invalid credentials'
            ? 'Invalid username or password.'
            : 'We could not log you in. Please try again.',
        )
        return
      }

      if (typeof data.id !== 'number' || typeof data.accessToken !== 'string') {
        setFormError('We could not start your session. Please try again.')
        return
      }

      onSuccess({
        id: data.id,
        accessToken: data.accessToken,
        username:
          typeof data.username === 'string' ? data.username : username.trim(),
      })
    } catch {
      setFormError(
        'Unable to connect. Check your internet connection and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-brand">
          <span className="brand-icon">
            <BagIcon />
          </span>
          <span>MyShop</span>
        </div>

        <div className="login-intro">
          <h1 id="login-heading">Welcome Back</h1>
          <p>Please login to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="form-alert" role="alert">
              {formError}
            </div>
          )}

          <div className="field-group">
            <label htmlFor="username">Username</label>
            <div
              className={`input-shell${fieldErrors.username ? ' invalid' : ''}`}
            >
              <span className="field-icon">
                <UserIcon />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (fieldErrors.username) {
                    setFieldErrors((current) => ({
                      ...current,
                      username: undefined,
                    }))
                  }
                }}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={
                  fieldErrors.username ? 'username-error' : undefined
                }
                disabled={isLoading}
              />
            </div>
            {fieldErrors.username && (
              <p className="field-error" id="username-error">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div
              className={`input-shell${fieldErrors.password ? ' invalid' : ''}`}
            >
              <span className="field-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((current) => ({
                      ...current,
                      password: undefined,
                    }))
                  }
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
                disabled={isLoading}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isLoading}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
            {fieldErrors.password && (
              <p className="field-error" id="password-error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button className="login-button" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Logging in…
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </section>
    </main>
  )
}

function AppShell({
  route,
  navigate,
  session,
  cartItems,
  onAddToCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveFromCart,
  onPlaceOrder,
}: {
  route: Route
  navigate: (route: Route) => void
  session: Session
  cartItems: CartItem[]
  onAddToCart: (product: Product) => Promise<void>
  onIncreaseQuantity: (productId: number) => void
  onDecreaseQuantity: (productId: number) => void
  onRemoveFromCart: (productId: number) => void
  onPlaceOrder: () => void
}) {
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  function handleNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    destination: Route,
  ) {
    event.preventDefault()
    navigate(destination)
  }

  return (
    <div className="app">
      <header className="site-header">
        <a
          className="header-brand"
          href="/products"
          onClick={(event) => handleNavigation(event, '/products')}
        >
          <span className="brand-icon">
            <BagIcon />
          </span>
          <span>MyShop</span>
        </a>

        <nav aria-label="Main navigation">
          <a
            href="/products"
            onClick={(event) => handleNavigation(event, '/products')}
            aria-current={route === '/products' ? 'page' : undefined}
          >
            Products
          </a>
          <a
            href="/cart"
            onClick={(event) => handleNavigation(event, '/cart')}
            aria-current={route === '/cart' ? 'page' : undefined}
          >
            Cart
          </a>
        </nav>

        <a
          className="cart-link"
          href="/cart"
          onClick={(event) => handleNavigation(event, '/cart')}
          aria-label={`Cart, ${cartCount} ${
            cartCount === 1 ? 'item' : 'items'
          }`}
          aria-current={route === '/cart' ? 'page' : undefined}
        >
          <CartIcon />
          <span className="cart-badge" aria-hidden="true">
            {cartCount}
          </span>
        </a>
      </header>

      <main className="app-main">
        {route === '/products' ? (
          <ProductsPage
            userId={session.id}
            username={session.username}
            onAddToCart={onAddToCart}
          />
        ) : (
          <CartPage
            items={cartItems}
            onIncrease={onIncreaseQuantity}
            onDecrease={onDecreaseQuantity}
            onRemove={onRemoveFromCart}
            onContinueShopping={() => navigate('/products')}
            onPlaceOrder={onPlaceOrder}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [route, setRoute] = useState<Route>(() => getRoute())
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    if (!session && window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/')
    }

    const handlePopState = () => {
      setRoute(getRoute())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [session])

  useEffect(() => {
    document.title = session
      ? route === '/cart'
        ? 'Cart | MyShop'
        : 'Products | MyShop'
      : 'Login | MyShop'
  }, [route, session])

  function handleLogin(nextSession: Session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    setRoute('/products')
    window.history.replaceState(null, '', '/products')
  }

  function navigate(destination: Route) {
    if (window.location.pathname !== destination) {
      window.history.pushState(null, '', destination)
    }
    setRoute(destination)
  }

  async function handleAddToCart(product: Product) {
    if (!session) throw new Error('Authentication required')

    const response = await fetch('https://dummyjson.com/carts/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.id,
        products: [{ id: product.id, quantity: 1 }],
      }),
    })
    if (!response.ok) {
      throw new Error(`Cart request failed: ${response.status}`)
    }

    setCartItems((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { product, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [...current, { product, quantity: 1 }]
    })
  }

  function changeQuantity(productId: number, change: number) {
    setCartItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item,
      ),
    )
  }

  return session ? (
    <AppShell
      route={route}
      navigate={navigate}
      session={session}
      cartItems={cartItems}
      onAddToCart={handleAddToCart}
      onIncreaseQuantity={(productId) => changeQuantity(productId, 1)}
      onDecreaseQuantity={(productId) => changeQuantity(productId, -1)}
      onRemoveFromCart={(productId) =>
        setCartItems((current) =>
          current.filter((item) => item.product.id !== productId),
        )
      }
      onPlaceOrder={() => setCartItems([])}
    />
  ) : (
    <Login onSuccess={handleLogin} />
  )
}
