import { useEffect } from 'react';

/** Sets `document.title` for the lifetime of the calling component. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
