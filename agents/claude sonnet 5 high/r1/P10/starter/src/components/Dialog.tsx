// Reusable accessible modal dialog.
// - role="dialog" + aria-modal, labelled by a caller-supplied id.
// - Escape closes; clicking the backdrop closes.
// - Focus moves into the dialog on open and is trapped there (Tab/Shift+Tab
//   cycle within it) so the background is never a tab target while open.
// - Focus returns to the element that had it before the dialog opened.
// - The app root is aria-hidden while open, and background scroll is locked.

import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './Dialog.css';

interface DialogProps {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Dialog({ labelledBy, onClose, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const appRoot = document.getElementById('root');
    appRoot?.setAttribute('aria-hidden', 'true');

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? panelRef.current)?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        } else if (!panelRef.current.contains(active)) {
          // Focus somehow escaped the dialog; pull it back in.
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      appRoot?.removeAttribute('aria-hidden');
      previouslyFocused?.focus();
    };
  }, [onClose]);

  function handleOverlayMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div className="dialog-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={panelRef} tabIndex={-1}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
