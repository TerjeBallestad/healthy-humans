import { useEffect, useRef, useState } from 'preact/hooks';
import { UPGRADES } from '../content/upgrades';
import { canBuy, hireCost } from '../sim/institution';
import { canPostAd } from '../sim/staff';
import type { GameState } from '../sim/state';
import { useGame } from '../store';
import { modal, openModal, type Modal } from './modal';

interface Toast {
  key: string;
  title: string;
  text: string;
  open?: Modal;
}

/** Real milliseconds a toast stays on screen. */
const TOAST_MS = 5000;

/** Things that just became possible. Each key toasts once a session. */
function events(s: GameState): Toast[] {
  const out: Toast[] = [];
  for (const u of UPGRADES)
    if (canBuy(s, u.id))
      out.push({
        key: `upgrade-${u.id}`,
        title: 'Upgrade ready',
        text: `${u.label}: ${u.effect.toLowerCase()}`,
        open: { kind: 'requests' },
      });
  if (canPostAd(s))
    out.push({
      key: `hire-${s.staff.length}`,
      title: 'You can hire',
      text: `A job ad costs ${hireCost(s)} kr.`,
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
      title: 'Upgrades ready',
      text: `${ups.length} upgrades you can buy.`,
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
    const shown = merge(fresh);
    setToasts((old) => [...old, ...shown]);
    for (const t of shown)
      setTimeout(() => setToasts((old) => old.filter((x) => x.key !== t.key)), TOAST_MS);
  });

  return (
    <div class="toasts" aria-live="polite">
      {toasts.map((t) => (
        <button
          class="toast"
          onClick={() => {
            setToasts((old) => old.filter((x) => x.key !== t.key));
            if (t.open && !modal.value) openModal(t.open);
          }}
        >
          <strong>{t.title}</strong>
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  );
}
