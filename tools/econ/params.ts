// Every number the economy model uses. Defaults come from the game's content files, so the
// tool starts from what ships. Model-only numbers (weeks per tier, exponents) have no home in
// the game and live only here.
import {
  BED_COST_BASE,
  BED_COST_GROWTH,
  BUDGET_START,
  GRANT_PER_BED,
  GRANT_PER_WEEK,
  HIRE_COST_BASE,
  HIRE_COST_GROWTH,
  MAX_BEDS,
  OMSORG_CAP,
  OMSORG_PER_SECOND,
  PACE,
  SECONDS_PER_WEEK,
  STAFF_NUDGES_PER_SECOND,
} from '../../src/content/tuning';
import { LINES, UPGRADE_COST_GROWTH, type LineId } from '../../src/content/upgrades';
import { MAX_STAFF, PAY_RAISE_START, ROLES } from '../../src/content/staff';
import { TIERS, type TierId } from '../../src/content/tiers';

export type { LineId, TierId };
export type ItemId = LineId | 'bed' | 'hire';
export type BuyRule = 'payback' | 'cheapest';

export interface LineParams {
  baseCost: number;
  /** Multiply the value each step (rate lines), or add to it (cap lines). */
  times?: number;
  plus?: number;
  /** Value before any step. */
  start: number;
  max?: number;
  /** Steps with a written name. Past these the names are placeholders. */
  written: number;
}

export interface Params {
  costGrowth: number;
  lines: Record<LineId, LineParams>;
  bedBase: number;
  bedGrowth: number;
  maxBeds: number;
  hireBase: number;
  hireGrowth: number;
  maxStaff: number;
  workerWage: number;
  grant: number;
  grantPerBed: number;
  budgetStart: number;
  tax: Record<TierId, number>;
  omsorgPerSecond: number;
  pace: number;
  staffNudgesPerSecond: number;
  secondsPerWeek: number;

  // Model only.
  /** Weeks for one resident to reach each tier, with one bed, no staff and no upgrades. */
  tierWeeks: Record<TierId, number>;
  /** The tier every resident is discharged at. */
  target: TierId;
  /** Weeks a bed stands empty between two residents. */
  admitGap: number;
  /** How much ladder speed follows nudges per bed. 1 = twice the nudges, twice the speed. */
  nudgeExp: number;
  /** How much ladder speed follows the house's overskudd multiplier. */
  overskuddExp: number;
  /** The fastest a ladder can run, as a multiple of the start. Activity durations set a floor. */
  maxSpeed: number;
  /** Share of play time the player is away. Omsorg stops at the cap while they are away. */
  awayShare: number;
  /** Real seconds of one typical absence. */
  awayStretch: number;
  /** Nudges per real second a player clicks. Omsorg past this is not spent. */
  tapsPerSecond: number;
  /** Weeks of tax one more discharge per week is worth, when the buyer compares items. */
  taxHorizon: number;
  /** Weeks the model runs. 48 weeks is one game year. */
  weeks: number;
  rule: BuyRule;
  /** Steps view 1 draws for each line. */
  steps: number;
}

const lineStart = (id: LineId) =>
  id === 'omsorgCap' ? OMSORG_CAP : id === 'payGrade' ? PAY_RAISE_START : id === 'insight' ? 0 : 1;

export function defaultParams(): Params {
  const lines = Object.fromEntries(
    LINES.map((l) => [
      l.id,
      {
        baseCost: l.baseCost,
        ...('times' in l.grow ? { times: l.grow.times } : { plus: l.grow.plus }),
        start: lineStart(l.id),
        max: l.max,
        written: l.steps.length,
      } satisfies LineParams,
    ]),
  ) as Record<LineId, LineParams>;
  return {
    costGrowth: UPGRADE_COST_GROWTH,
    lines,
    bedBase: BED_COST_BASE,
    bedGrowth: BED_COST_GROWTH,
    maxBeds: MAX_BEDS,
    hireBase: HIRE_COST_BASE,
    hireGrowth: HIRE_COST_GROWTH,
    maxStaff: MAX_STAFF,
    workerWage: ROLES.worker.wage,
    grant: GRANT_PER_WEEK,
    grantPerBed: GRANT_PER_BED,
    budgetStart: BUDGET_START,
    tax: Object.fromEntries(TIERS.map((t) => [t.id, t.taxPerWeek])) as Record<TierId, number>,
    omsorgPerSecond: OMSORG_PER_SECOND,
    pace: PACE,
    staffNudgesPerSecond: STAFF_NUDGES_PER_SECOND,
    secondsPerWeek: SECONDS_PER_WEEK,
    // From `npm run sim` on 2026-10-12: rung 9 near week 19 and the work trial near week 35,
    // with one miljøarbeider. Without staff it is slower.
    tierWeeks: { alone: 14, work: 24, healthy: 40 },
    target: 'healthy',
    admitGap: 1,
    nudgeExp: 1,
    overskuddExp: 0.4,
    // A guess. Activities last real seconds, so no number of upgrades makes a ladder instant.
    maxSpeed: 8,
    awayShare: 0.3,
    awayStretch: 60,
    // `npm run sim` taps 0.6 per second when it may tap 1.
    tapsPerSecond: 0.6,
    taxHorizon: 52,
    weeks: 240,
    rule: 'payback',
    steps: 10,
  };
}

/** Lines the model can value. The pay grade only matters with staff courses, which it leaves out. */
export const MODELLED_LINES: LineId[] = LINES.map((l) => l.id).filter((id) => id !== 'payGrade');

/** Where a changed value lives in the game, for the copy button. */
export function changes(p: Params): string[] {
  const d = defaultParams();
  const out: string[] = [];
  const same = (a: number | undefined, b: number | undefined) => a === b;
  const tuning: [string, number, number][] = [
    ['BED_COST_BASE', p.bedBase, d.bedBase],
    ['BED_COST_GROWTH', p.bedGrowth, d.bedGrowth],
    ['MAX_BEDS', p.maxBeds, d.maxBeds],
    ['HIRE_COST_BASE', p.hireBase, d.hireBase],
    ['HIRE_COST_GROWTH', p.hireGrowth, d.hireGrowth],
    ['GRANT_PER_WEEK', p.grant, d.grant],
    ['GRANT_PER_BED', p.grantPerBed, d.grantPerBed],
    ['OMSORG_PER_SECOND', p.omsorgPerSecond, d.omsorgPerSecond],
    ['OMSORG_CAP', p.lines.omsorgCap.start, d.lines.omsorgCap.start],
    ['PACE', p.pace, d.pace],
    ['STAFF_NUDGES_PER_SECOND', p.staffNudgesPerSecond, d.staffNudgesPerSecond],
  ];
  for (const [name, v, was] of tuning) {
    if (!same(v, was)) out.push(`tuning.ts     ${name} = ${v};  // was ${was}`);
  }
  if (p.costGrowth !== d.costGrowth) {
    out.push(`upgrades.ts   UPGRADE_COST_GROWTH = ${p.costGrowth};  // was ${d.costGrowth}`);
  }
  for (const id of Object.keys(p.lines) as LineId[]) {
    const a = p.lines[id];
    const b = d.lines[id];
    if (a.baseCost !== b.baseCost) {
      out.push(`upgrades.ts   ${id}.baseCost = ${a.baseCost};  // was ${b.baseCost}`);
    }
    if (!same(a.times, b.times) || !same(a.plus, b.plus)) {
      const g = (x: LineParams) =>
        x.times !== undefined ? `{ times: ${x.times} }` : `{ plus: ${x.plus} }`;
      out.push(`upgrades.ts   ${id}.grow = ${g(a)};  // was ${g(b)}`);
    }
    if (!same(a.max, b.max)) out.push(`upgrades.ts   ${id}.max = ${a.max};  // was ${b.max}`);
  }
  if (p.maxStaff !== d.maxStaff)
    out.push(`staff.ts      MAX_STAFF = ${p.maxStaff};  // was ${d.maxStaff}`);
  if (p.workerWage !== d.workerWage) {
    out.push(`staff.ts      ROLES.worker.wage = ${p.workerWage};  // was ${d.workerWage}`);
  }
  for (const t of TIERS) {
    if (p.tax[t.id] !== d.tax[t.id]) {
      out.push(`tiers.ts      ${t.id}.taxPerWeek = ${p.tax[t.id]};  // was ${d.tax[t.id]}`);
    }
  }
  return out;
}
