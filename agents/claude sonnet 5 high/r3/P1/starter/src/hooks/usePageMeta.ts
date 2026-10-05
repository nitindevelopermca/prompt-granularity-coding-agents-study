import { useEffect } from 'react'

/**
 * Sets a meaningful document title and non-empty meta description for the
 * current view. Supports the specification's SEO / document-structure rules.
 */
export function usePageMeta(title: string, description: string): void {
  useEffect(() => {
    document.title = title

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)
  }, [title, description])
}
