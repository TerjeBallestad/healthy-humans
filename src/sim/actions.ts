import type { ActivityId } from '../content/activities';
import { ACTIVITY_BY_ID } from '../content/activities';
import { MAX_SKILL, OMSORG_PER_NUDGE, barSize, trainCost } from '../content/tuning';
import { STAFF_NAMES, UPGRADE_BY_ID, type UpgradeId } from '../content/upgrades';
import { canBuy, canHire, hireCost } from './institution';
import type { GameState } from './state';
import { levelUp, log } from './tick';

export function canNudge(state: GameState, id: ActivityId): boolean {
  const r = state.resident;
  const size = barSize(r.skill[id]);
  return size > 0 && state.omsorg >= OMSORG_PER_NUDGE && r.bars[id] < size;
}

/** Spend omsorg on one nudge into an activity's bar. */
export function nudge(state: GameState, id: ActivityId): boolean {
  if (!canNudge(state, id)) return false;
  state.omsorg -= OMSORG_PER_NUDGE;
  state.resident.bars[id] += 1;
  return true;
}

export function canTrain(state: GameState, id: ActivityId): boolean {
  const r = state.resident;
  const unlocked = ACTIVITY_BY_ID[id].rung <= r.unlockedRung;
  return unlocked && r.skill[id] < MAX_SKILL && r.overskudd >= trainCost(r.skill[id]);
}

/** Spend overskudd to raise an activity one skill level. */
export function train(state: GameState, id: ActivityId): boolean {
  if (!canTrain(state, id)) return false;
  const r = state.resident;
  const a = ACTIVITY_BY_ID[id];
  r.overskudd -= trainCost(r.skill[id]);
  log(state, a.trained);
  levelUp(state, r, a);
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
