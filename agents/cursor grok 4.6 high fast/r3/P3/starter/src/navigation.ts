import type { AppPath } from './types'

export function currentPath(): AppPath {
  const path = window.location.pathname
  if (path === '/cart') return '/cart'
  if (path === '/products') return '/products'
  return '/login'
}

export function navigate(path: AppPath, replace = false): void {
  const method = replace ? 'replaceState' : 'pushState'
  window.history[method]({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function pathTitle(path: AppPath, authenticated: boolean): string {
  if (!authenticated) {
    return 'Login | MyShop'
  }
  if (path === '/cart') {
    return 'Cart | MyShop'
  }
  return 'Products | MyShop'
}
