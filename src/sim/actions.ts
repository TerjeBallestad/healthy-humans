import type { ActivityId } from '../content/activities';
import { ACTIVITY_BY_ID } from '../content/activities';
import { MAX_SKILL, OMSORG_PER_NUDGE, trainCost } from '../content/tuning';
import { STAFF_NAMES, UPGRADE_BY_ID, type UpgradeId } from '../content/upgrades';
import { bedCost, canBuy, canBuyBed, canHire, hireCost } from './institution';
import { effort } from './selectors';
import { newResident, type GameState } from './state';
import { ARCHETYPE_BY_ID } from '../content/archetypes';
import { levelUp, log } from './tick';

export function canNudge(state: GameState, bed: number, id: ActivityId): boolean {
  const r = state.beds[bed];
  if (!r) return false;
  const size = effort(r, id);
  return size > 0 && state.omsorg >= OMSORG_PER_NUDGE && r.bars[id] < size;
}

/** Spend omsorg on one nudge into an activity's bar. */
export function nudge(state: GameState, bed: number, id: ActivityId): boolean {
  if (!canNudge(state, bed, id)) return false;
  state.omsorg -= OMSORG_PER_NUDGE;
  state.beds[bed]!.bars[id] += 1;
  return true;
}

export function canTrain(state: GameState, bed: number, id: ActivityId): boolean {
  const r = state.beds[bed];
  if (!r) return false;
  const unlocked = ACTIVITY_BY_ID[id].rung <= r.unlockedRung;
  return unlocked && r.skill[id] < MAX_SKILL && r.overskudd >= trainCost(r.skill[id]);
}

/** Spend overskudd to raise an activity one skill level. */
export function train(state: GameState, bed: number, id: ActivityId): boolean {
  if (!canTrain(state, bed, id)) return false;
  const r = state.beds[bed]!;
  const a = ACTIVITY_BY_ID[id];
  r.overskudd -= trainCost(r.skill[id]);
  log(state, a.trained, r.name);
  levelUp(state, r, a);
  return true;
}

export function buyBed(state: GameState): boolean {
  if (!canBuyBed(state)) return false;
  state.budget -= bedCost(state);
  state.beds.push(null);
  state.selected = state.beds.length - 1;
  log(state, 'A new bed is made up. It is empty.');
  return true;
}

export function freeBed(state: GameState): number {
  return state.beds.indexOf(null);
}

/** Move someone from the waiting list into the first free bed. */
export function admit(state: GameState, index: number): boolean {
  const bed = freeBed(state);
  const person = state.waiting[index];
  if (bed < 0 || !person) return false;
  const a = ARCHETYPE_BY_ID[person.archetype];
  state.waiting.splice(index, 1);
  state.beds[bed] = newResident(a.id, person.health, state.tick, person.trait);
  state.selected = bed;
  log(state, a.arrives);
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
