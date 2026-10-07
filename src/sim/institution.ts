import {
  GRANT_PER_DAY,
  HIRE_COST_BASE,
  HIRE_COST_GROWTH,
  OMSORG_CAP,
  OMSORG_PER_HOUR,
  STAFF_WAGE_PER_DAY,
} from '../content/tuning';
import { STAFF_NAMES, UPGRADE_BY_ID, type UpgradeId } from '../content/upgrades';
import type { GameState } from './state';

export function omsorgCap(s: GameState): number {
  return s.upgrades.reduce((cap, id) => cap + (UPGRADE_BY_ID[id].capAdd ?? 0), OMSORG_CAP);
}

export function omsorgPerHour(s: GameState): number {
  return s.upgrades.reduce((rate, id) => rate * (UPGRADE_BY_ID[id].rateMult ?? 1), OMSORG_PER_HOUR);
}

export function wagesPerDay(s: GameState): number {
  return s.staff.length * STAFF_WAGE_PER_DAY;
}

export function netIncomePerDay(s: GameState): number {
  return GRANT_PER_DAY - wagesPerDay(s);
}

export function hireCost(s: GameState): number {
  return Math.round(HIRE_COST_BASE * HIRE_COST_GROWTH ** s.staff.length);
}

/** Wages may never eat the whole grant. */
export function canAffordWage(s: GameState): boolean {
  return netIncomePerDay(s) - STAFF_WAGE_PER_DAY >= 0;
}

export function canHire(s: GameState): boolean {
  return canAffordWage(s) && s.budget >= hireCost(s) && s.staff.length < STAFF_NAMES.length;
}

export function canBuy(s: GameState, id: UpgradeId): boolean {
  return !s.upgrades.includes(id) && s.budget >= UPGRADE_BY_ID[id].cost;
}
