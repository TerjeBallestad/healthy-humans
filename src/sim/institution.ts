import {
  BED_COST_BASE,
  BED_COST_GROWTH,
  GRANT_PER_WEEK,
  HIRE_COST_BASE,
  HIRE_COST_GROWTH,
  MAX_BEDS,
  OMSORG_CAP,
  OMSORG_PER_SECOND,
  STAFF_NUDGES_PER_SECOND,
  STAFF_WAGE_PER_WEEK,
} from '../content/tuning';
import { STAFF_NAMES, UPGRADE_BY_ID, type UpgradeId } from '../content/upgrades';
import { taxPerWeek } from './discharge';
import type { GameState } from './state';

export function omsorgCap(_s: GameState): number {
  return OMSORG_CAP;
}

export function omsorgPerSecond(_s: GameState): number {
  return OMSORG_PER_SECOND;
}

/** Segments one of the player's nudges fills. */
export function nudgeMult(s: GameState): number {
  return Math.max(1, ...s.upgrades.map((id) => UPGRADE_BY_ID[id].nudgeMult ?? 1));
}

/** Multiplies staff nudges. */
export function staffMult(s: GameState): number {
  return Math.max(1, ...s.upgrades.map((id) => UPGRADE_BY_ID[id].staffMult ?? 1));
}

/** Free nudges per real second from all staff at 1x. */
export function staffNudgesPerSecond(s: GameState): number {
  return s.staff.length * STAFF_NUDGES_PER_SECOND * staffMult(s);
}

/** Skill levels the coach trains: bought and switched on. */
export function coachSteps(s: GameState): number[] {
  return s.upgrades
    .map((id) => UPGRADE_BY_ID[id].coachStep)
    .filter((step): step is number => !!step && !s.coachOff.includes(step));
}

export function wagesPerWeek(s: GameState): number {
  return s.staff.length * STAFF_WAGE_PER_WEEK;
}

export function netIncomePerWeek(s: GameState): number {
  return GRANT_PER_WEEK + taxPerWeek(s) - wagesPerWeek(s);
}

export function hireCost(s: GameState): number {
  return Math.round(HIRE_COST_BASE * HIRE_COST_GROWTH ** s.staff.length);
}

/** Wages may never eat the whole grant. */
export function canAffordWage(s: GameState): boolean {
  return netIncomePerWeek(s) - STAFF_WAGE_PER_WEEK >= 0;
}

export function canHire(s: GameState): boolean {
  return canAffordWage(s) && s.budget >= hireCost(s) && s.staff.length < STAFF_NAMES.length;
}

/** Not bought yet, and anything it builds on is bought. */
export function offered(s: GameState, id: UpgradeId): boolean {
  const after = UPGRADE_BY_ID[id].after;
  return !s.upgrades.includes(id) && (!after || s.upgrades.includes(after));
}

export function canBuy(s: GameState, id: UpgradeId): boolean {
  return offered(s, id) && s.budget >= UPGRADE_BY_ID[id].cost;
}

export function bedCost(s: GameState): number {
  return Math.round(BED_COST_BASE * BED_COST_GROWTH ** (s.beds.length - 1));
}

export function canBuyBed(s: GameState): boolean {
  return s.beds.length < MAX_BEDS && s.budget >= bedCost(s);
}
