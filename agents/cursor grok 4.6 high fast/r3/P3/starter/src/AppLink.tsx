import type { MouseEvent, ReactNode } from 'react'
import type { AppPath } from './types'
import { navigate } from './navigation'

type AppLinkProps = {
  to: AppPath
  className?: string
  children: ReactNode
  'aria-label'?: string
  'aria-current'?: 'page' | undefined
}

export function AppLink({ to, className, children, ...aria }: AppLinkProps) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
      return
    }
    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} className={className} onClick={onClick} {...aria}>
      {children}
    </a>
  )
}
