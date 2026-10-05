// Sets a meaningful document title and a non-empty meta description for the
// current view, restoring the previous values on cleanup.

import { useEffect } from 'react';

export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    const previousDescription = meta.getAttribute('content');
    meta.setAttribute('content', description);

    return () => {
      document.title = previousTitle;
      if (created) {
        meta?.remove();
      } else if (previousDescription !== null) {
        meta?.setAttribute('content', previousDescription);
      }
    };
  }, [title, description]);
}
