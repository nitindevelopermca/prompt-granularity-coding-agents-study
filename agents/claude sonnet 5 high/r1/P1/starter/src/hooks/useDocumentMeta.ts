import { useEffect } from 'react'

/**
 * Sets a meaningful document title and meta description for the current
 * page. Restores the previous values on unmount so navigating between
 * pages always reflects the active view.
 */
export function useDocumentMeta(title: string, description: string): void {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const createdMeta = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    const previousDescription = meta.content
    meta.content = description

    return () => {
      document.title = previousTitle
      if (meta) {
        if (createdMeta) {
          meta.remove()
        } else {
          meta.content = previousDescription
        }
      }
    }
  }, [title, description])
}
