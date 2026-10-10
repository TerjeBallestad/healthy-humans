import {
  BED_COST_BASE,
  BED_COST_GROWTH,
  GRANT_PER_BED,
  GRANT_PER_WEEK,
  HIRE_COST_BASE,
  HIRE_COST_GROWTH,
  MAX_BEDS,
  OMSORG_CAP,
  OMSORG_PER_SECOND,
  PACE,
  STAFF_NUDGES_PER_SECOND,
} from '../content/tuning';
import { MESTRING_BONUS, ROLES, type StaffRole } from '../content/staff';
import { UPGRADE_BY_ID, type UpgradeId } from '../content/upgrades';
import { taxPerWeek } from './discharge';
import type { GameState } from './state';

export function omsorgCap(s: GameState): number {
  return Math.max(OMSORG_CAP, ...s.upgrades.map((id) => UPGRADE_BY_ID[id].omsorgCap ?? 0));
}

export function omsorgPerSecond(s: GameState): number {
  const mult = Math.max(1, ...s.upgrades.map((id) => UPGRADE_BY_ID[id].omsorgRateMult ?? 1));
  return OMSORG_PER_SECOND * PACE * mult;
}

/** Segments one of the player's nudges fills. */
export function nudgeMult(s: GameState): number {
  return Math.max(1, ...s.upgrades.map((id) => UPGRADE_BY_ID[id].nudgeMult ?? 1));
}

/** Multiplies staff nudges. */
export function staffMult(s: GameState): number {
  return Math.max(1, ...s.upgrades.map((id) => UPGRADE_BY_ID[id].staffMult ?? 1));
}

/** Multiplies the kommune grant. */
export function grantMult(s: GameState): number {
  return Math.max(1, ...s.upgrades.map((id) => UPGRADE_BY_ID[id].grantMult ?? 1));
}

/** The kommune pays a base sum and a sum for each extra bed. The grant upgrades multiply both. */
/** Multiplies overskudd for every resident: the house upgrades, and each staff member with the mestring course. */
export function overskuddMult(s: GameState): number {
  const house = Math.max(1, ...s.upgrades.map((id) => UPGRADE_BY_ID[id].overskuddMult ?? 1));
  return house * (1 + MESTRING_BONUS * s.staff.filter((x) => x.mestring).length);
}

export function grantPerWeek(s: GameState): number {
  return (GRANT_PER_WEEK + GRANT_PER_BED * (s.beds.length - 1)) * grantMult(s);
}

/** Nudges per real second from one miljøarbeider at 1x. */
export function workerNudgesPerSecond(s: GameState): number {
  return STAFF_NUDGES_PER_SECOND * PACE * staffMult(s);
}

/** Free nudges per real second from all miljøarbeidere at 1x. */
export function staffNudgesPerSecond(s: GameState): number {
  return s.staff.filter((x) => x.role === 'worker').length * workerNudgesPerSecond(s);
}

export function wagesPerWeek(s: GameState): number {
  return s.staff.reduce((sum, x) => sum + ROLES[x.role].wage, 0);
}

export function netIncomePerWeek(s: GameState): number {
  return grantPerWeek(s) + taxPerWeek(s) - wagesPerWeek(s);
}

/** The price of a job ad. It rises with each staff member. */
export function hireCost(s: GameState): number {
  return Math.round(HIRE_COST_BASE * HIRE_COST_GROWTH ** s.staff.length);
}

/** Wages may never eat the whole grant. */
export function canAffordWage(s: GameState, role: StaffRole): boolean {
  return netIncomePerWeek(s) - ROLES[role].wage >= 0;
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
