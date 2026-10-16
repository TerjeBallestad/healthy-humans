import { signal } from '@preact/signals';
import { LINES, LINE_BY_ID, type LineId } from '../content/upgrades';
import { buyUpgrade } from '../sim/actions';
import {
  canBuy,
  lineLevel,
  lineOpen,
  lineShown,
  lineValue,
  nextStep,
  upgradeCost,
} from '../sim/institution';
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
  return LINES.filter((l) => canBuy(s, l.id)).length;
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
              const count = LINES.filter((l) => l.tab === t.id && canBuy(s, l.id)).length;
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
          {LINES.filter((l) => l.tab === tab.value && lineShown(s, l.id)).map((l) => (
            <LineCard line={l.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** What a line's next step gives, as the card and the toast say it. */
export function stepEffect(s: GameState, line: LineId): string {
  const v = lineValue(line, Math.min(lineLevel(s, line) + 1, LINE_BY_ID[line].max ?? Infinity));
  const x = String(Math.round(v * 100) / 100);
  const e = UPGRADES_MENU.effect;
  if (line === 'nudge') return e.nudge(v);
  if (line === 'omsorgCap') return e.omsorgCap(v);
  if (line === 'payGrade') return e.payGrade(v);
  if (line === 'insight') return e.insight();
  return e[line](x);
}

/** One card per line. It shows the next step, or the last one when a line with an end is done. */
function LineCard({ line }: { line: LineId }) {
  const s = useGame();
  const step = nextStep(s, line);
  const open = lineOpen(s, line);
  const max = LINE_BY_ID[line].max;
  const bought = lineLevel(s, line);
  return (
    <article class={open ? 'request' : 'request done'}>
      <span class="icon" aria-hidden="true">
        {step.icon}
      </span>
      <div class="text">
        <strong class="title">{step.label}</strong>
        <span class="effect">{stepEffect(s, line)}</span>
        {max !== undefined && (
          <span class="pips" aria-label={UNITS.levelOf(bought, max)}>
            {Array.from({ length: max }, (_, i) => (
              <span class={i < bought ? 'pip on' : 'pip'} />
            ))}
          </span>
        )}
      </div>
      <div class="buy-col">
        {open ? (
          <>
            <span class="price">{UNITS.kr(upgradeCost(s, line))}</span>
            <button
              class="buy-request"
              disabled={!canBuy(s, line)}
              onClick={() => act((g) => buyUpgrade(g, line))}
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
