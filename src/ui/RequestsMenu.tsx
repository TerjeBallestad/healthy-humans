import { signal } from '@preact/signals';
import { LINES, UPGRADES, type LineId } from '../content/upgrades';
import { buyUpgrade } from '../sim/actions';
import { canBuy } from '../sim/institution';
import type { GameState } from '../sim/state';
import { act, useGame } from '../store';
import { closeModal, modal } from './modal';
import { UNITS, UPGRADES_MENU } from '../content/text';

type Tab = 'you' | 'staff' | 'funding' | 'house';
const TABS: { id: Tab; label: string }[] = (['you', 'staff', 'funding', 'house'] as const).map(
  (id) => ({ id, label: UPGRADES_MENU.tabs[id] }),
);

const tab = signal<Tab>('you');

/** Upgrades the player can buy right now, for the button badge. */
export function affordableRequests(s: GameState): number {
  return UPGRADES.filter((u) => canBuy(s, u.id)).length;
}

export function RequestsMenu() {
  const s = useGame();
  if (modal.value?.kind !== 'requests') return null;
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div class="dialog requests" role="dialog" aria-modal="true" aria-label={UPGRADES_MENU.title}>
        <header>
          <nav class="tabs" role="tablist">
            {TABS.map((t) => {
              const count = LINES.filter(
                (l) => l.tab === t.id && UPGRADES.some((u) => u.line === l.id && canBuy(s, u.id)),
              ).length;
              return (
                <button
                  role="tab"
                  aria-selected={tab.value === t.id}
                  class={tab.value === t.id ? 'tab on' : 'tab'}
                  onClick={() => (tab.value = t.id)}
                >
                  {t.label}
                  {count > 0 && <span class="badge">{count}</span>}
                </button>
              );
            })}
          </nav>
          <button class="close" onClick={closeModal} aria-label={UNITS.close}>
            ✕
          </button>
        </header>
        <div class="lines">
          {LINES.filter((l) => l.tab === tab.value).map((l) => (
            <LineCard line={l.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** One card per line. It shows the next level, or the last one when the line is done. */
function LineCard({ line }: { line: LineId }) {
  const s = useGame();
  const levels = UPGRADES.filter((u) => u.line === line);
  const bought = levels.filter((u) => s.upgrades.includes(u.id)).length;
  const next = levels[bought];
  const shown = next ?? levels[levels.length - 1]!;
  return (
    <article class={next ? 'request' : 'request done'}>
      <span class="icon" aria-hidden="true">
        {shown.icon}
      </span>
      <div class="text">
        <strong class="title">{shown.label}</strong>
        <span class="effect">{shown.effect}</span>
        {levels.length > 1 && (
          <span class="pips" aria-label={UNITS.levelOf(bought, levels.length)}>
            {levels.map((_, i) => (
              <span class={i < bought ? 'pip on' : 'pip'} />
            ))}
          </span>
        )}
      </div>
      <div class="buy-col">
        {next ? (
          <>
            <span class="price">{UNITS.kr(next.cost)}</span>
            <button
              class="buy-request"
              disabled={!canBuy(s, next.id)}
              onClick={() => act((g) => buyUpgrade(g, next.id))}
            >
              {UPGRADES_MENU.buy}
            </button>
          </>
        ) : (
          <span class="tick" aria-label={UNITS.done}>
            ✓
          </span>
        )}
      </div>
    </article>
  );
}
