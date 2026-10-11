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
import { COACH_BASE_LEVELS, MESTRING_BONUS, ROLES, WAGE_PER_LEVEL } from '../content/staff';
import {
  LINE_BY_ID,
  UPGRADE_COST_GROWTH,
  type LineId,
  type UpgradeStep,
} from '../content/upgrades';
import { UPGRADES_MENU } from '../content/text';
import { taxPerWeek } from './discharge';
import type { GameState, Staff } from './state';

/** Steps bought in one upgrade line. */
export function lineLevel(s: GameState, line: LineId): number {
  return s.levels[line] ?? 0;
}

/** A line's value after some steps. Multiplier lines start at 1. Others start at their base. */
export function lineValue(line: LineId, steps: number): number {
  const grow = LINE_BY_ID[line].grow;
  const base = line === 'omsorgCap' ? OMSORG_CAP : 1;
  return 'times' in grow ? base * grow.times ** steps : base + grow.plus * steps;
}

function value(s: GameState, line: LineId): number {
  return lineValue(line, lineLevel(s, line));
}

export function omsorgCap(s: GameState): number {
  return value(s, 'omsorgCap');
}

export function omsorgPerSecond(s: GameState): number {
  return OMSORG_PER_SECOND * PACE * value(s, 'omsorgRate');
}

/** Segments one of the player's nudges fills. */
export function nudgeMult(s: GameState): number {
  return value(s, 'nudge');
}

/** Multiplies staff nudges. */
export function staffMult(s: GameState): number {
  return value(s, 'staff');
}

/** Multiplies the kommune grant. */
export function grantMult(s: GameState): number {
  return value(s, 'grant');
}

/** The kommune pays a base sum and a sum for each extra bed. The grant upgrades multiply both. */
/** Multiplies overskudd for every resident: the house upgrades, and each staff member with the mestring course. */
export function overskuddMult(s: GameState): number {
  const house = value(s, 'house');
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

/** Courses a staff member has, past what every new hire of the role has. Each one raises the wage. */
export function courses(x: Staff): number {
  const mestring = x.mestring ? 1 : 0;
  if (x.role === 'worker') return mestring + Math.max(0, x.specialities.length - 1);
  if (x.role === 'caseworker') return mestring + (x.level ?? 1) - 1;
  const levels = Object.values(x.coaching).reduce((a, b) => a + (b ?? 0), 0);
  return mestring + Math.max(0, levels - COACH_BASE_LEVELS);
}

/** Kroner per week: the role's wage, and more for each course. */
export function wage(x: Staff): number {
  return ROLES[x.role].wage + WAGE_PER_LEVEL[x.role] * courses(x);
}

export function wagesPerWeek(s: GameState): number {
  return s.staff.reduce((sum, x) => sum + wage(x), 0);
}

export function netIncomePerWeek(s: GameState): number {
  return grantPerWeek(s) + taxPerWeek(s) - wagesPerWeek(s);
}

/** The price of a job ad. It rises with each staff member. */
export function hireCost(s: GameState): number {
  return Math.round(HIRE_COST_BASE * HIRE_COST_GROWTH ** s.staff.length);
}

/** Wages may never eat the whole grant. True when the income can pay this much more each week. */
export function canAffordWage(s: GameState, kr: number): boolean {
  return netIncomePerWeek(s) - kr >= 0;
}

/** The price of the next step in a line. */
export function upgradeCost(s: GameState, line: LineId): number {
  return Math.round(LINE_BY_ID[line].baseCost * UPGRADE_COST_GROWTH ** lineLevel(s, line));
}

/** False when a line with an end has every step. */
export function lineOpen(s: GameState, line: LineId): boolean {
  const max = LINE_BY_ID[line].max;
  return max === undefined || lineLevel(s, line) < max;
}

export function canBuy(s: GameState, line: LineId): boolean {
  return lineOpen(s, line) && s.budget >= upgradeCost(s, line);
}

/** The next step in a line, or the last one when the line is done. */
export function nextStep(s: GameState, line: LineId): UpgradeStep {
  const max = LINE_BY_ID[line].max;
  const n = Math.min(lineLevel(s, line) + 1, max ?? Infinity);
  const written = LINE_BY_ID[line].steps;
  const last = written[written.length - 1]!;
  return written[n - 1] ?? { ...last, label: UPGRADES_MENU.repeatName(last.label, n), note: '' };
}

export function bedCost(s: GameState): number {
  return Math.round(BED_COST_BASE * BED_COST_GROWTH ** (s.beds.length - 1));
}

export function canBuyBed(s: GameState): boolean {
  return s.beds.length < MAX_BEDS && s.budget >= bedCost(s);
}
