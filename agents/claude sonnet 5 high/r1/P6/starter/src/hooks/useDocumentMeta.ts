// Sets a meaningful document title and non-empty meta description per
// route, per spec/SPEC_FREEZE.md non-functional (SEO) requirements.

import { useEffect } from 'react';

export function useDocumentMeta(title: string, description: string): void {
  useEffect(() => {
    document.title = title;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    const previousDescription = meta.getAttribute('content');
    meta.setAttribute('content', description);

    return () => {
      if (meta && previousDescription !== null) {
        meta.setAttribute('content', previousDescription);
      }
    };
  }, [title, description]);
}
