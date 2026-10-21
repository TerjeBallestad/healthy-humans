// The economy as formulas. No needs, no taps, no RNG: a resident is a timer that runs faster with
// more nudges and more overskudd, and a discharge adds tax for the rest of the game.
import { MODELLED_LINES, type ItemId, type LineId, type Params } from './params';

// ---------- View 1: one item, step by step ----------

/** Price of a line's next step when `owned` steps are bought. Same formula as `upgradeCost`. */
export function lineCost(p: Params, id: LineId, owned: number): number {
  return Math.round(p.lines[id].baseCost * p.costGrowth ** owned);
}

/** A line's value after some steps. Same formula as `lineValue` in the game. */
export function lineValue(p: Params, id: LineId, steps: number): number {
  const l = p.lines[id];
  return l.times !== undefined ? l.start * l.times ** steps : l.start + (l.plus ?? 0) * steps;
}

/** Price of the next bed when `beds` beds stand in the house. */
export function bedCost(p: Params, beds: number): number {
  return Math.round(p.bedBase * p.bedGrowth ** (beds - 1));
}

/** Price of the next job ad when `staff` people are hired. */
export function hireCost(p: Params, staff: number): number {
  return Math.round(p.hireBase * p.hireGrowth ** staff);
}

export interface Step {
  /** 1 = the first purchase. */
  n: number;
  price: number;
  /** Value after this step. */
  value: number;
  /** What this step adds. */
  gain: number;
  /** Price per unit of gain, divided by the same for step 1. */
  perGain: number;
  /** Weeks of the gain to pay the price. Only for items that pay kroner. */
  payback?: number;
  /** Past the written names. */
  unnamed: boolean;
}

export interface ItemCurve {
  id: ItemId;
  steps: Step[];
}

export function itemCurve(p: Params, id: ItemId): ItemCurve {
  const raw: Omit<Step, 'perGain'>[] = [];
  const max =
    id === 'bed' ? p.maxBeds - 1 : id === 'hire' ? p.maxStaff : (p.lines[id].max ?? Infinity);
  for (let n = 1; n <= Math.min(p.steps, max); n++) {
    if (id === 'bed') {
      // A bed adds to the grant. Its residents pay tax too, but that depends on the ladder (view 2).
      raw.push({
        n,
        price: bedCost(p, n),
        value: n + 1,
        gain: 1,
        payback: bedCost(p, n) / p.grantPerBed,
        unnamed: false,
      });
    } else if (id === 'hire') {
      raw.push({ n, price: hireCost(p, n - 1), value: n, gain: 1, unnamed: false });
    } else {
      const value = lineValue(p, id, n);
      const gain = value - lineValue(p, id, n - 1);
      const price = lineCost(p, id, n - 1);
      raw.push({
        n,
        price,
        value,
        gain,
        payback: id === 'grant' ? price / (p.grant * gain) : undefined,
        unnamed: n > p.lines[id].written,
      });
    }
  }
  const first = raw[0] ? raw[0].price / raw[0].gain : 1;
  return { id, steps: raw.map((s) => ({ ...s, perGain: s.price / s.gain / first })) };
}

// ---------- View 2: the economy over time ----------

export interface Holdings {
  beds: number;
  workers: number;
  levels: Record<LineId, number>;
}

const v = (p: Params, h: Holdings, id: LineId) => lineValue(p, id, h.levels[id]);

/**
 * Segments per real second from the player. While away they cannot tap, and omsorg stops at the
 * cap. While present they spend omsorg no faster than they tap. One nudge costs 1 omsorg.
 * Staff keep working while the player is away.
 */
export function playerSupply(p: Params, h: Holdings): number {
  const rate = p.omsorgPerSecond * p.pace * v(p, h, 'omsorgRate');
  const cap = v(p, h, 'omsorgCap');
  const here = 1 - p.awayShare;
  const omsorg = rate * here + p.awayShare * Math.min(rate, cap / p.awayStretch);
  return Math.min(omsorg, p.tapsPerSecond * here) * v(p, h, 'nudge');
}

export function workerSupply(p: Params, h: Holdings): number {
  return h.workers * p.staffNudgesPerSecond * p.pace * v(p, h, 'staff');
}

const START: Holdings = {
  beds: 1,
  workers: 0,
  levels: Object.fromEntries(MODELLED_LINES.map((id) => [id, 0])) as Record<LineId, number>,
};

/** How fast a resident climbs, as a multiple of one bed with no staff and no upgrades. Capped. */
export function ladderSpeed(p: Params, h: Holdings): number {
  const perBed = (playerSupply(p, h) + workerSupply(p, h)) / h.beds;
  const base = playerSupply(p, START);
  const speed = (perBed / base) ** p.nudgeExp * v(p, h, 'house') ** p.overskuddExp;
  return Math.min(speed, p.maxSpeed);
}

export function grantPerWeek(p: Params, h: Holdings): number {
  return (p.grant + p.grantPerBed * (h.beds - 1)) * v(p, h, 'grant');
}

/** Discharges per week across all beds, at the target tier. */
export function dischargeRate(p: Params, h: Holdings): number {
  return h.beds / (p.tierWeeks[p.target] / ladderSpeed(p, h) + p.admitGap);
}

/** What the buyer tries to raise: income now, plus future tax from faster discharges. */
function worth(p: Params, h: Holdings): number {
  return (
    grantPerWeek(p, h) -
    h.workers * p.workerWage +
    p.taxHorizon * p.tax[p.target] * dischargeRate(p, h)
  );
}

function after(h: Holdings, id: ItemId): Holdings {
  if (id === 'bed') return { ...h, beds: h.beds + 1 };
  if (id === 'hire') return { ...h, workers: h.workers + 1 };
  return { ...h, levels: { ...h.levels, [id]: h.levels[id] + 1 } };
}

function price(p: Params, h: Holdings, id: ItemId): number {
  if (id === 'bed') return bedCost(p, h.beds);
  if (id === 'hire') return hireCost(p, h.workers);
  return lineCost(p, id, h.levels[id]);
}

export interface Option {
  id: ItemId;
  price: number;
  /** Rise in `worth` per week. */
  gain: number;
}

/** What the buyer could buy next, with what each one is worth. */
export function options(p: Params, h: Holdings, taxNow: number): Option[] {
  const ids: ItemId[] = [...MODELLED_LINES, 'bed', 'hire'];
  const base = worth(p, h);
  const net = grantPerWeek(p, h) + taxNow - h.workers * p.workerWage;
  return ids
    .filter((id) => {
      if (id === 'bed') return h.beds < p.maxBeds;
      if (id === 'hire') return h.workers < p.maxStaff && net - p.workerWage >= 0;
      const max = p.lines[id].max;
      return max === undefined || h.levels[id] < max;
    })
    .map((id) => ({ id, price: price(p, h, id), gain: worth(p, after(h, id)) - base }))
    .filter((o) => o.gain > 1e-9);
}

/** The next purchase under the rule, or null when nothing helps. */
export function pick(p: Params, os: Option[]): Option | null {
  const score = (o: Option) => (p.rule === 'payback' ? o.price / o.gain : o.price);
  return os.reduce<Option | null>((best, o) => (!best || score(o) < score(best) ? o : best), null);
}

export interface Sample {
  week: number;
  budget: number;
  grant: number;
  tax: number;
  wages: number;
  net: number;
  speed: number;
  /** Weeks until the buyer can pay for its next pick, at today's income. */
  wait: number;
}

export interface Purchase {
  week: number;
  id: ItemId;
  /** 1 = the first of this item. */
  n: number;
  price: number;
  /** Weeks since the purchase before. */
  gap: number;
  unnamed: boolean;
}

export interface Discharge {
  week: number;
  bed: number;
}

export interface Marker {
  week: number;
  label: string;
}

export interface Trace {
  samples: Sample[];
  purchases: Purchase[];
  discharges: Discharge[];
  markers: Marker[];
  final: Holdings;
}

const DT = 0.05;
const SAMPLE_EVERY = 0.5;

export function run(p: Params): Trace {
  let h: Holdings = { ...START, levels: { ...START.levels } };
  let budget = p.budgetStart;
  let tax = 0;
  const beds = [{ progress: 0, emptyUntil: 0 }];
  const samples: Sample[] = [];
  const purchases: Purchase[] = [];
  const discharges: Discharge[] = [];
  let lastBuy = 0;
  let nextSample = 0;

  for (let t = 0; t <= p.weeks + 1e-9; t += DT) {
    const speed = ladderSpeed(p, h);
    beds.forEach((b, i) => {
      if (t < b.emptyUntil) return;
      b.progress += (DT * speed) / p.tierWeeks[p.target];
      if (b.progress >= 1) {
        b.progress = 0;
        b.emptyUntil = t + p.admitGap;
        tax += p.tax[p.target];
        discharges.push({ week: t, bed: i });
      }
    });
    const grant = grantPerWeek(p, h);
    const wages = h.workers * p.workerWage;
    budget += DT * (grant + tax - wages);

    // Buy while the pick is affordable. Otherwise save for it.
    for (;;) {
      const o = pick(p, options(p, h, tax));
      if (!o || o.price > budget) break;
      budget -= o.price;
      h = after(h, o.id);
      if (o.id === 'bed') beds.push({ progress: 0, emptyUntil: t });
      const n = o.id === 'bed' ? h.beds - 1 : o.id === 'hire' ? h.workers : h.levels[o.id];
      purchases.push({
        week: t,
        id: o.id,
        n,
        price: o.price,
        gap: t - lastBuy,
        unnamed: o.id !== 'bed' && o.id !== 'hire' && n > p.lines[o.id].written,
      });
      lastBuy = t;
    }

    if (t >= nextSample - 1e-9) {
      const net = grant + tax - wages;
      const o = pick(p, options(p, h, tax));
      const wait = o ? Math.max(0, o.price - budget) / Math.max(net, 1e-9) : NaN;
      samples.push({ week: t, budget, grant, tax, wages, net, speed, wait });
      nextSample += SAMPLE_EVERY;
    }
  }

  return { samples, purchases, discharges, markers: markers(p, purchases, discharges), final: h };
}

function markers(p: Params, purchases: Purchase[], discharges: Discharge[]): Marker[] {
  const out: Marker[] = [];
  const first = (f: (x: Purchase) => boolean) => purchases.find(f)?.week;
  const add = (label: string, week: number | undefined) => {
    if (week !== undefined) out.push({ week, label });
  };
  add(
    'First hire',
    first((x) => x.id === 'hire'),
  );
  if (discharges[0]) add('First discharge', discharges[0].week);
  add(
    'Beds full',
    first((x) => x.id === 'bed' && x.n === p.maxBeds - 1),
  );
  add(
    'Staff full',
    first((x) => x.id === 'hire' && x.n === p.maxStaff),
  );
  // The written names run out when every line has bought all its named steps.
  const done = MODELLED_LINES.map((id) => {
    const need = Math.min(p.lines[id].written, p.lines[id].max ?? Infinity);
    return first((x) => x.id === id && x.n === need);
  });
  if (done.every((w) => w !== undefined)) add('Named steps done', Math.max(...(done as number[])));
  return out.sort((a, b) => a.week - b.week);
}

/** Real minutes at 1x for a number of weeks. */
export function minutes(p: Params, weeks: number): number {
  return (weeks * p.secondsPerWeek) / 60;
}
