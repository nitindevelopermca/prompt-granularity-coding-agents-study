import { useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import CartPage, { type CartItem } from './CartPage'
import ProductCatalog, { type Product } from './ProductCatalog'

type Session = {
  id: number
  accessToken: string
}

type Route = '/login' | '/products' | '/cart'

const SESSION_KEY = 'myshop-session'

function readSession(): Session | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Session).id === 'number' &&
      typeof (value as Session).accessToken === 'string'
    ) {
      return value as Session
    }
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
  }
  return null
}

function getRoute(): Route {
  if (window.location.pathname === '/products') return '/products'
  if (window.location.pathname === '/cart') return '/cart'
  return '/login'
}

function BagIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.75 8.25h10.5l1.25 12H5.5l1.25-12Z" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? 'brand brand--compact' : 'brand'}>
      <span className="brand__mark">
        <BagIcon />
      </span>
      <span>MyShop</span>
    </span>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
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
      <path d="M3 4h2l2 11h10.5l2-7H6" />
      <circle cx="9" cy="19" r="1.25" />
      <circle cx="17" cy="19" r="1.25" />
    </svg>
  )
}

function LoginPage({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: { username?: string; password?: string } = {}

    if (!username.trim()) errors.username = 'Enter your username.'
    if (!password) errors.password = 'Enter your password.'
    setFieldErrors(errors)
    setFormError('')

    if (Object.keys(errors).length > 0) return

    setLoading(true)
    try {
      const response = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : ''
        setFormError(
          response.status === 400 && message === 'Invalid credentials'
            ? 'The username or password you entered is incorrect.'
            : 'We couldn’t sign you in. Please try again.',
        )
        return
      }

      if (
        typeof data !== 'object' ||
        data === null ||
        !('id' in data) ||
        typeof data.id !== 'number' ||
        !('accessToken' in data) ||
        typeof data.accessToken !== 'string'
      ) {
        setFormError('We received an unexpected response. Please try again.')
        return
      }

      const session = { id: data.id, accessToken: data.accessToken }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      onSuccess(session)
    } catch {
      setFormError('We couldn’t connect. Check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-card__brand">
          <Brand />
        </div>
        <div className="login-card__intro">
          <h1 id="login-heading">Welcome back</h1>
          <p>Sign in to continue shopping.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="form-alert" role="alert">
              {formError}
            </div>
          )}

          <div className="field">
            <label htmlFor="username">Username</label>
            <div className={`input-wrap ${fieldErrors.username ? 'input-wrap--error' : ''}`}>
              <span className="input-icon">
                <UserIcon />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (fieldErrors.username) setFieldErrors((current) => ({ ...current, username: undefined }))
                }}
                placeholder="Enter your username"
                autoComplete="username"
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                disabled={loading}
              />
            </div>
            {fieldErrors.username && (
              <p className="field-error" id="username-error">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className={`input-wrap ${fieldErrors.password ? 'input-wrap--error' : ''}`}>
              <span className="input-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }))
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                disabled={loading}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={loading}
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

          <button className="login-button" type="submit" disabled={loading}>
            {loading && <span className="spinner" aria-hidden="true" />}
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}

type AppLinkProps = {
  to: Route
  navigate: (route: Route) => void
  className?: string
  children: ReactNode
  current?: boolean
}

function AppLink({ to, navigate, className, children, current }: AppLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault()
      navigate(to)
    }
  }

  return (
    <a href={to} onClick={handleClick} className={className} aria-current={current ? 'page' : undefined}>
      {children}
    </a>
  )
}

function AppShell({
  route,
  navigate,
  userId,
  cartItems,
  onAddToCart,
  onQuantityChange,
  onRemoveFromCart,
  onPlaceOrder,
}: {
  route: Route
  navigate: (route: Route) => void
  userId: number
  cartItems: CartItem[]
  onAddToCart: (product: Product) => Promise<void>
  onQuantityChange: (productId: number, quantity: number) => void
  onRemoveFromCart: (productId: number) => void
  onPlaceOrder: () => void
}) {
  const isProducts = route === '/products'
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="app-page">
      <header className="site-header">
        <div className="site-header__inner">
          <AppLink to="/products" navigate={navigate} className="brand-link">
            <Brand compact />
          </AppLink>
          <nav aria-label="Main navigation" className="site-nav">
            <AppLink to="/products" navigate={navigate} current={isProducts}>
              Products
            </AppLink>
            <AppLink
              to="/cart"
              navigate={navigate}
              current={!isProducts}
              className="cart-link"
            >
              <span>Cart</span>
              <span className="cart-icon">
                <CartIcon />
                <span
                  className="cart-badge"
                  aria-label={`${cartCount} ${cartCount === 1 ? 'item' : 'items'} in cart`}
                >
                  {cartCount}
                </span>
              </span>
            </AppLink>
          </nav>
        </div>
      </header>
      {isProducts ? (
        <ProductCatalog userId={userId} onAddToCart={onAddToCart} />
      ) : (
        <CartPage
          items={cartItems}
          onContinueShopping={() => navigate('/products')}
          onQuantityChange={onQuantityChange}
          onRemove={onRemoveFromCart}
          onPlaceOrder={onPlaceOrder}
        />
      )}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [route, setRoute] = useState<Route>(() => getRoute())
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  function navigate(nextRoute: Route, replace = false) {
    const safeRoute = nextRoute !== '/login' && !session ? '/login' : nextRoute
    window.history[replace ? 'replaceState' : 'pushState']({}, '', safeRoute)
    setRoute(safeRoute)
  }

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!session && route !== '/login') {
      navigate('/login', true)
    } else if (session && route === '/login') {
      navigate('/products', true)
    }
  }, [route, session])

  useEffect(() => {
    document.title =
      route === '/cart' ? 'Cart | MyShop' : route === '/products' ? 'Products | MyShop' : 'Login | MyShop'
  }, [route])

  function handleLogin(successfulSession: Session) {
    setSession(successfulSession)
    window.history.replaceState({}, '', '/products')
    setRoute('/products')
  }

  async function addToCart(product: Product) {
    if (!session) throw new Error('Authentication required')

    const response = await fetch('https://dummyjson.com/carts/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.id,
        products: [{ id: product.id, quantity: 1 }],
      }),
    })

    if (!response.ok) throw new Error(`Cart request failed with ${response.status}`)

    setCartItems((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [...current, { product, quantity: 1 }]
    })
  }

  function changeQuantity(productId: number, quantity: number) {
    if (quantity < 1) return
    setCartItems((current) =>
      current.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
    )
  }

  function removeFromCart(productId: number) {
    setCartItems((current) => current.filter((item) => item.product.id !== productId))
  }

  if (!session) return <LoginPage onSuccess={handleLogin} />
  return (
    <AppShell
      route={route === '/login' ? '/products' : route}
      navigate={navigate}
      userId={session.id}
      cartItems={cartItems}
      onAddToCart={addToCart}
      onQuantityChange={changeQuantity}
      onRemoveFromCart={removeFromCart}
      onPlaceOrder={() => setCartItems([])}
    />
  )
}
