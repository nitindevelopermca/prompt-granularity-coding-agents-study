export const ROUTES = {
  login: '/',
  products: '/products',
  cart: '/cart',
} as const

export function navigate(path: string): void {
  if (window.location.pathname === path) {
    return
  }
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function replaceLocation(path: string): void {
  if (window.location.pathname === path) {
    return
  }
  window.history.replaceState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
