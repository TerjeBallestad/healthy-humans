import {
  BED_COST_BASE,
  BED_COST_GROWTH,
  GRANT_PER_WEEK,
  HIRE_COST_BASE,
  HIRE_COST_GROWTH,
  MAX_BEDS,
  OMSORG_CAP,
  OMSORG_PER_SECOND,
  STAFF_WAGE_PER_WEEK,
} from '../content/tuning';
import { STAFF_NAMES, UPGRADE_BY_ID, type UpgradeId } from '../content/upgrades';
import { taxPerWeek } from './discharge';
import type { GameState } from './state';

export function omsorgCap(s: GameState): number {
  return s.upgrades.reduce((cap, id) => cap + (UPGRADE_BY_ID[id].capAdd ?? 0), OMSORG_CAP);
}

export function omsorgPerSecond(s: GameState): number {
  return s.upgrades.reduce(
    (rate, id) => rate * (UPGRADE_BY_ID[id].rateMult ?? 1),
    OMSORG_PER_SECOND,
  );
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

export function canBuy(s: GameState, id: UpgradeId): boolean {
  return !s.upgrades.includes(id) && s.budget >= UPGRADE_BY_ID[id].cost;
}

export function bedCost(s: GameState): number {
  return Math.round(BED_COST_BASE * BED_COST_GROWTH ** (s.beds.length - 1));
}

export function canBuyBed(s: GameState): boolean {
  return s.beds.length < MAX_BEDS && s.budget >= bedCost(s);
}
