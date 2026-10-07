import type { ActivityId } from '../content/activities';
import { barSize } from '../content/tuning';
import { STAFF_NAMES, UPGRADE_BY_ID, type UpgradeId } from '../content/upgrades';
import { canBuy, canHire, hireCost } from './institution';
import type { GameState } from './state';
import { log } from './tick';

export function canNudge(state: GameState, id: ActivityId): boolean {
  const r = state.resident;
  const size = barSize(r.skill[id]);
  return size > 0 && state.omsorg >= 1 && r.bars[id] < size;
}

/** Spend one omsorg on an activity's nudge bar. */
export function nudge(state: GameState, id: ActivityId): boolean {
  if (!canNudge(state, id)) return false;
  state.omsorg -= 1;
  state.resident.bars[id] += 1;
  return true;
}

export function hire(state: GameState): boolean {
  if (!canHire(state)) return false;
  state.budget -= hireCost(state);
  const name = STAFF_NAMES[state.staff.length] ?? 'Someone';
  state.staff.push(name);
  log(state, `${name} starts on the day shift.`);
  return true;
}

export function buyUpgrade(state: GameState, id: UpgradeId): boolean {
  if (!canBuy(state, id)) return false;
  const u = UPGRADE_BY_ID[id];
  state.budget -= u.cost;
  state.upgrades.push(id);
  log(state, `${u.label}. ${u.note}`);
  return true;
}
