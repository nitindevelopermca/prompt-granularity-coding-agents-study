import { useEffect, useState } from 'react'
import type { Route } from './types'

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0]
  if (path === 'cart') {
    return 'cart'
  }
  if (path === 'login') {
    return 'login'
  }
  return 'products'
}

export function navigate(route: Route): void {
  window.location.hash = `/${route}`
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}

export function pageTitle(route: Route, authenticated: boolean): string {
  if (!authenticated || route === 'login') {
    return 'MyShop — Sign in'
  }
  if (route === 'cart') {
    return 'MyShop — Your Cart'
  }
  return 'MyShop — All Products'
}
