import { HIRE_COST_BASE } from '../content/tuning';
import { UPGRADES } from '../content/upgrades';
import { canTrain } from './actions';
import { bestTier } from './discharge';
import { canBuy, canBuyBed } from './institution';
import { unlockedActivities } from './selectors';
import type { GameState } from './state';

/** Parts of the screen that stay hidden until they first matter. */
export type RevealId = 'staff' | 'upgrades' | 'beds' | 'overskudd';

/** True when the player has seen this part or tip. Old saves have no list and see everything. */
export function isSeen(s: GameState, key: string): boolean {
  return !s.seen || s.seen.includes(key);
}

export function markSeen(s: GameState, key: string) {
  if (s.seen && !s.seen.includes(key)) s.seen.push(key);
}

const WHEN: Record<RevealId, (s: GameState) => boolean> = {
  staff: (s) => s.budget >= HIRE_COST_BASE || s.staff.length > 0,
  upgrades: (s) => UPGRADES.some((u) => canBuy(s, u.id)) || s.upgrades.length > 0,
  beds: (s) =>
    canBuyBed(s) ||
    s.beds.length > 1 ||
    s.discharged.length > 0 ||
    s.beds.some((r) => r && bestTier(r)),
  overskudd: (s) =>
    s.beds.some((r, i) => r && unlockedActivities(r).some((a) => canTrain(s, i, a.id))),
};

/** Called each tick. Once shown, a part stays. */
export function updateReveals(s: GameState) {
  if (!s.seen) return;
  for (const id of Object.keys(WHEN) as RevealId[])
    if (!s.seen.includes(id) && WHEN[id](s)) s.seen.push(id);
}
