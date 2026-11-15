import { useEffect, useRef } from 'react';
import { UnifiedAction, inputManager } from './InputManager';

interface ControllerMenuNavOptions {
  enabled: boolean;
  scopeKey?: string;
  onCancel?: () => void;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'select:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  '[tabindex="0"]:not([aria-disabled="true"])',
].join(',');

function isElementVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') {
    return false;
  }
  let cur: HTMLElement | null = el.parentElement;
  while (cur && cur !== document.documentElement) {
    const cs = getComputedStyle(cur);
    if (cs.display === 'none' || cs.visibility === 'hidden') {
      return false;
    }
    cur = cur.parentElement;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 1 && rect.height > 1;
}

function getActiveScope(): HTMLElement {
  const scopes = Array.from(document.querySelectorAll<HTMLElement>('[data-gamepad-scope]')).filter((el) =>
    isElementVisible(el)
  );
  if (scopes.length > 0) {
    return scopes[scopes.length - 1];
  }
  return document.getElementById('root') || document.body;
}

function getFocusables(scope: HTMLElement): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isElementVisible);
}

function focusElement(el: HTMLElement) {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
}

function setReactRangeValue(el: HTMLInputElement, nextVal: number) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) {
    setter.call(el, String(nextVal));
  } else {
    el.value = String(nextVal);
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function cycleSelectOption(el: HTMLSelectElement) {
  if (el.options.length === 0) return;
  const nextIndex = (el.selectedIndex + 1) % el.options.length;
  const nextValue = el.options[nextIndex].value;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  if (setter) {
    setter.call(el, nextValue);
  } else {
    el.value = nextValue;
  }
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export function useControllerMenuNav({ enabled, scopeKey, onCancel }: ControllerMenuNavOptions) {
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  // Remove gamepad focus ring highlight when user switches back to mouse/touch pointer
  useEffect(() => {
    const clearHighlight = () => {
      document.body.classList.remove('gamepad-nav-active');
    };
    window.addEventListener('pointerdown', clearHighlight, { passive: true });
    return () => window.removeEventListener('pointerdown', clearHighlight);
  }, []);

  // Auto-focus default control whenever a new menu/modal opens
  useEffect(() => {
    if (!enabled) return;
    const raf = window.requestAnimationFrame(() => {
      const scope = getActiveScope();
      const focusables = getFocusables(scope);
      if (focusables.length === 0) return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && focusables.includes(activeEl)) return;

      const preferred = scope.querySelector<HTMLElement>('[data-gamepad-default]');
      const target = preferred && focusables.includes(preferred) ? preferred : focusables[0];
      if (inputManager.activeDevice === 'playstation' || inputManager.playstationConnected) {
        document.body.classList.add('gamepad-nav-active');
      }
      focusElement(target);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [enabled, scopeKey]);

  useEffect(() => {
    if (!enabled) return;

    const unsub = inputManager.onAction((action: UnifiedAction) => {
      const scope = getActiveScope();
      const focusables = getFocusables(scope);
      const activeEl = document.activeElement as HTMLElement | null;
      const hasFocusInScope = Boolean(activeEl && focusables.includes(activeEl));

      if (action === 'cancel') {
        const backBtn = scope.querySelector<HTMLElement>('[data-gamepad-back]:not([disabled])');
        if (backBtn && isElementVisible(backBtn)) {
          backBtn.click();
        } else {
          onCancelRef.current?.();
        }
        return;
      }

      if (action === 'tab_prev' || action === 'tab_next') {
        const tabs = Array.from(scope.querySelectorAll<HTMLElement>('[data-gamepad-tab]:not([disabled])')).filter(
          isElementVisible
        );
        if (tabs.length === 0) return;
        document.body.classList.add('gamepad-nav-active');
        let idx = tabs.findIndex((t) => t.getAttribute('data-gamepad-tab-active') === 'true');
        if (idx === -1) idx = 0;
        const delta = action === 'tab_next' ? 1 : -1;
        const nextTab = tabs[(idx + delta + tabs.length) % tabs.length];
        nextTab.click();
        return;
      }

      if (action === 'confirm') {
        document.body.classList.add('gamepad-nav-active');
        if (!hasFocusInScope) {
          if (focusables.length > 0) {
            const preferred = scope.querySelector<HTMLElement>('[data-gamepad-default]');
            const target = preferred && focusables.includes(preferred) ? preferred : focusables[0];
            focusElement(target);
          }
          return;
        }
        if (activeEl instanceof HTMLSelectElement) {
          cycleSelectOption(activeEl);
        } else if (
          activeEl instanceof HTMLInputElement &&
          (activeEl.type === 'text' || activeEl.type === 'search')
        ) {
          activeEl.focus();
        } else if (activeEl) {
          activeEl.click();
        }
        return;
      }

      if (
        action !== 'nav_up' &&
        action !== 'nav_down' &&
        action !== 'nav_left' &&
        action !== 'nav_right'
      ) {
        return;
      }

      document.body.classList.add('gamepad-nav-active');

      if (!hasFocusInScope || !activeEl) {
        if (focusables.length > 0) {
          const preferred = scope.querySelector<HTMLElement>('[data-gamepad-default]');
          const target = preferred && focusables.includes(preferred) ? preferred : focusables[0];
          focusElement(target);
        }
        return;
      }

      // Range slider left/right stepping
      if (
        activeEl instanceof HTMLInputElement &&
        activeEl.type === 'range' &&
        (action === 'nav_left' || action === 'nav_right')
      ) {
        const min = parseFloat(activeEl.min || '0');
        const max = parseFloat(activeEl.max || '100');
        const step = parseFloat(activeEl.step || '1') || (max - min) / 20;
        const current = parseFloat(activeEl.value || String(min));
        const isRtl = document.documentElement.dir === 'rtl';
        const dirSign = action === 'nav_right' ? (isRtl ? -1 : 1) : isRtl ? 1 : -1;
        const rawNext = current + dirSign * step;
        const clamped = Math.min(max, Math.max(min, Number(rawNext.toFixed(4))));
        setReactRangeValue(activeEl, clamped);
        return;
      }

      const curRect = activeEl.getBoundingClientRect();
      const cx = curRect.left + curRect.width / 2;
      const cy = curRect.top + curRect.height / 2;

      let bestEl: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const candidate of focusables) {
        if (candidate === activeEl) continue;
        const rect = candidate.getBoundingClientRect();
        const tx = rect.left + rect.width / 2;
        const ty = rect.top + rect.height / 2;
        const dx = tx - cx;
        const dy = ty - cy;

        let primary = 0;
        let ortho = 0;

        if (action === 'nav_up') {
          if (dy >= -2) continue;
          primary = -dy;
          ortho = Math.abs(dx);
        } else if (action === 'nav_down') {
          if (dy <= 2) continue;
          primary = dy;
          ortho = Math.abs(dx);
        } else if (action === 'nav_left') {
          if (dx >= -2) continue;
          primary = -dx;
          ortho = Math.abs(dy);
        } else if (action === 'nav_right') {
          if (dx <= 2) continue;
          primary = dx;
          ortho = Math.abs(dy);
        }

        const score = primary + ortho * 2.2;
        if (score < bestScore) {
          bestScore = score;
          bestEl = candidate;
        }
      }

      if (bestEl) {
        focusElement(bestEl);
      }
    });

    return unsub;
  }, [enabled]);
}
