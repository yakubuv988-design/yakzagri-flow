export interface FocusTrapOptions {
  /** Element to focus when the trap activates. Defaults to the first focusable element. */
  initialFocus?: HTMLElement | null;
  /** Called when Escape is pressed while the trap is active. */
  onEscape?: () => void;
  /** Whether to restore focus to the previously focused element on release. Defaults to true. */
  restoreFocus?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
  'video[controls]',
  'audio[controls]',
].join(',');

function isVisible(el: HTMLElement): boolean {
  if (el.hasAttribute('hidden')) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  return nodes.filter((el) => !el.hasAttribute('disabled') && isVisible(el));
}

/**
 * Traps keyboard focus within `container` while active.
 * Returns a release function that removes listeners and restores prior focus.
 */
export function trapFocus(
  container: HTMLElement,
  options: FocusTrapOptions = {},
): () => void {
  const { initialFocus, onEscape, restoreFocus = true } = options;
  const previouslyFocused = document.activeElement as HTMLElement | null;

  const focusInitial = () => {
    const target =
      initialFocus && container.contains(initialFocus)
        ? initialFocus
        : getFocusableElements(container)[0] ?? container;
    if (target === container && !container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '-1');
    }
    target.focus();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (onEscape) {
        event.stopPropagation();
        onEscape();
      }
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !container.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleFocusIn = (event: FocusEvent) => {
    const target = event.target as Node | null;
    if (target && !container.contains(target)) {
      focusInitial();
    }
  };

  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('focusin', handleFocusIn, true);
  focusInitial();

  return () => {
    document.removeEventListener('keydown', handleKeyDown, true);
    document.removeEventListener('focusin', handleFocusIn, true);
    if (restoreFocus && previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}
