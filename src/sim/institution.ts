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
import {
  LINE_BY_ID,
  MILESTONE_BONUS,
  MILESTONE_EVERY,
  UPGRADE_COST_GROWTH,
  UPGRADE_STEP,
  type LineId,
  type UpgradeMilestone,
} from '../content/upgrades';
import { UPGRADES_MENU } from '../content/text';
import { taxPerWeek } from './discharge';
import type { GameState } from './state';

/** Levels bought in one upgrade line. */
export function lineLevel(s: GameState, line: LineId): number {
  return s.levels[line] ?? 0;
}

/** A line's multiplier at a level: each level adds a step, and each named milestone doubles it. */
export function multAt(level: number): number {
  return (1 + UPGRADE_STEP * level) * MILESTONE_BONUS ** Math.floor(level / MILESTONE_EVERY);
}

function lineMult(s: GameState, line: LineId): number {
  return multAt(lineLevel(s, line));
}

export function omsorgCap(s: GameState): number {
  return Math.round(OMSORG_CAP * lineMult(s, 'omsorgCap'));
}

export function omsorgPerSecond(s: GameState): number {
  return OMSORG_PER_SECOND * PACE * lineMult(s, 'omsorgRate');
}

/** Segments one of the player's nudges fills: always the whole part, and one more by chance. */
export function nudgeFill(s: GameState): { whole: number; chance: number } {
  return splitFill(lineMult(s, 'nudge'));
}

/** 1.3 segments is 1 segment and a 30% chance of 2. Segments are never split. */
export function splitFill(mult: number): { whole: number; chance: number } {
  const whole = Math.floor(mult + 1e-9);
  return { whole, chance: Math.round((mult - whole) * 100) / 100 };
}

/** Multiplies staff nudges. */
export function staffMult(s: GameState): number {
  return lineMult(s, 'staff');
}

/** Multiplies the kommune grant. */
export function grantMult(s: GameState): number {
  return lineMult(s, 'grant');
}

/** The kommune pays a base sum and a sum for each extra bed. The grant upgrades multiply both. */
/** Multiplies overskudd for every resident: the house upgrades, and each staff member with the mestring course. */
export function overskuddMult(s: GameState): number {
  const house = lineMult(s, 'house');
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

/** The price of the next level in a line. */
export function upgradeCost(s: GameState, line: LineId): number {
  return Math.round(LINE_BY_ID[line].baseCost * UPGRADE_COST_GROWTH ** lineLevel(s, line));
}

export function canBuy(s: GameState, line: LineId): boolean {
  return s.budget >= upgradeCost(s, line);
}

/** The named milestone a line works toward: the one at the end of its current run of levels. */
export function nextMilestone(s: GameState, line: LineId): UpgradeMilestone & { level: number } {
  const n = Math.floor(lineLevel(s, line) / MILESTONE_EVERY) + 1;
  const written = LINE_BY_ID[line].milestones;
  const m = written[n - 1] ?? {
    ...written[written.length - 1]!,
    label: UPGRADES_MENU.repeatName(written[written.length - 1]!.label, n),
    note: '',
  };
  return { ...m, level: n * MILESTONE_EVERY };
}

export function bedCost(s: GameState): number {
  return Math.round(BED_COST_BASE * BED_COST_GROWTH ** (s.beds.length - 1));
}

export function canBuyBed(s: GameState): boolean {
  return s.beds.length < MAX_BEDS && s.budget >= bedCost(s);
}
