import { signal } from '@preact/signals';
import { LINES, MILESTONE_EVERY, type LineId } from '../content/upgrades';
import { buyUpgrade } from '../sim/actions';
import {
  canBuy,
  lineLevel,
  multAt,
  nextMilestone,
  splitFill,
  upgradeCost,
} from '../sim/institution';
import { OMSORG_CAP } from '../content/tuning';
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
          {LINES.filter((l) => l.tab === tab.value).map((l) => (
            <LineCard line={l.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** A line's value at a level, as the effect line shows it. */
function shown(line: LineId, level: number): string {
  const mult = multAt(level);
  if (line === 'nudge') {
    const { whole, chance } = splitFill(mult);
    return UPGRADES_MENU.fill(whole, chance);
  }
  if (line === 'omsorgCap') return String(Math.round(OMSORG_CAP * mult));
  return String(Math.round(mult * 10) / 10);
}

/** One card per line. The title is the next named milestone, and the pips count the levels to it. */
function LineCard({ line }: { line: LineId }) {
  const s = useGame();
  const level = lineLevel(s, line);
  const m = nextMilestone(s, line);
  const run = level % MILESTONE_EVERY;
  return (
    <article class="request">
      <span class="icon" aria-hidden="true">
        {m.icon}
      </span>
      <div class="text">
        <strong class="title">
          {m.label} <span class="muted">{UPGRADES_MENU.level(level)}</span>
        </strong>
        <span class="effect">
          {UPGRADES_MENU.effect[line](shown(line, level), shown(line, level + 1))}
        </span>
        <span class="pips" aria-label={UNITS.levelOf(run, MILESTONE_EVERY)}>
          {Array.from({ length: MILESTONE_EVERY }, (_, i) => (
            <span class={i < run ? 'pip on' : i === MILESTONE_EVERY - 1 ? 'pip goal' : 'pip'} />
          ))}
        </span>
      </div>
      <div class="buy-col">
        <span class="price">{UNITS.kr(upgradeCost(s, line))}</span>
        <button
          class="buy-request"
          disabled={!canBuy(s, line)}
          onClick={() => act((g) => buyUpgrade(g, line))}
        >
          {UPGRADES_MENU.buy}
        </button>
      </div>
    </article>
  );
}
