import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { LINES } from '../content/upgrades';
import { canBuy, hireCost, lineLevel, nextStep } from '../sim/institution';
import { stepEffect } from './RequestsMenu';
import { isSeen } from '../sim/reveal';
import { canPostAd } from '../sim/staff';
import type { GameState } from '../sim/state';
import { useGame } from '../store';
import { modal, openModal, type Modal } from './modal';
import { TOASTS } from '../content/text';

interface Toast {
  key: string;
  /** The onboarding tip that says the same. No toast while that tip is not done. */
  tip?: string;
  /** The button the toast points at. */
  target: string;
  icon?: string;
  title: string;
  text: string;
  open?: Modal;
}

/** Real milliseconds a toast stays on screen. */
const TOAST_MS = 5000;

/** Things that just became possible. Each key toasts once a session. */
function events(s: GameState): Toast[] {
  const out: Toast[] = [];
  for (const l of LINES)
    if (canBuy(s, l.id))
      out.push({
        key: `upgrade-${l.id}-${lineLevel(s, l.id)}`,
        tip: 'tip:upgrades',
        target: '[data-tip="upgrades"]',
        icon: nextStep(s, l.id).icon,
        title: TOASTS.upgradeReady,
        text: TOASTS.upgrade(nextStep(s, l.id).label, stepEffect(s, l.id)),
        open: { kind: 'requests' },
      });
  if (canPostAd(s))
    out.push({
      key: `hire-${s.staff.length}`,
      tip: 'tip:hire',
      target: '[data-tip="hire"]',
      title: TOASTS.canHire,
      text: TOASTS.adCost(hireCost(s)),
    });
  return out;
}

/** Several upgrades at once become one toast. */
function merge(fresh: Toast[]): Toast[] {
  const ups = fresh.filter((t) => t.key.startsWith('upgrade-'));
  if (ups.length < 2) return fresh;
  return [
    ...fresh.filter((t) => !ups.includes(t)),
    {
      key: ups.map((t) => t.key).join('+'),
      target: '[data-tip="upgrades"]',
      icon: ups[0]!.icon,
      title: TOASTS.upgradesReady,
      text: TOASTS.upgrades(ups.length),
      open: { kind: 'requests' },
    },
  ];
}

export function Toasts() {
  const s = useGame();
  const seen = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const now = events(s);
    // Things that are already possible at load are not news.
    if (!seen.current) {
      seen.current = new Set(now.map((t) => t.key));
      return;
    }
    const fresh = now.filter((t) => !seen.current!.has(t.key));
    if (fresh.length === 0) return;
    fresh.forEach((t) => seen.current!.add(t.key));
    const shown = merge(fresh.filter((t) => !t.tip || isSeen(s, t.tip)));
    setToasts((old) => [...old, ...shown]);
    for (const t of shown)
      setTimeout(() => setToasts((old) => old.filter((x) => x.key !== t.key)), TOAST_MS);
  });

  const close = (t: Toast) => {
    setToasts((old) => old.filter((x) => x.key !== t.key));
    if (t.open && !modal.value) openModal(t.open);
  };
  // One stack per button, beside it.
  const targets = [...new Set(toasts.map((t) => t.target))];
  return (
    <>
      {targets.map((target) => (
        <ToastStack
          target={target}
          toasts={toasts.filter((t) => t.target === target)}
          onClick={close}
        />
      ))}
    </>
  );
}

/** Toasts to the right of their button, pointing at it. Bottom right when the button is not on screen. */
function ToastStack(p: { target: string; toasts: Toast[]; onClick: (t: Toast) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const b = box.current;
    const el = document.querySelector<HTMLElement>(p.target);
    if (!b) return;
    const r = el?.getBoundingClientRect();
    if (!r || r.height === 0) {
      b.removeAttribute('style');
      b.dataset.anchored = 'false';
      return;
    }
    const h = b.offsetHeight;
    b.style.left = `${r.right + 12}px`;
    b.style.top = `${Math.max(8, Math.min(r.top + r.height / 2 - h / 2, window.innerHeight - h - 8))}px`;
    b.dataset.anchored = 'true';
  });
  return (
    <div class="toasts" ref={box} aria-live="polite">
      {p.toasts.map((t) => (
        <button class="toast" onClick={() => p.onClick(t)}>
          {t.icon && (
            <span class="toast-icon" aria-hidden="true">
              {t.icon}
            </span>
          )}
          <span class="toast-text">
            <strong>{t.title}</strong>
            <span>{t.text}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
