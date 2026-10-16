import { describe, expect, test } from 'vitest';
import { ACTIVITIES } from '../content/activities';
import {
  ATTEMPT_BONUS,
  MAX_SKILL,
  PROPOSAL_COOLDOWN_WEEKS,
  PROPOSAL_COST_MILESTONE,
} from '../content/tuning';
import {
  FIT_OVERSKUDD_BOOST,
  FIT_POOR_STRAIN,
  FIT_TAX_MULT,
  MILESTONE_BY_ID,
} from '../content/milestones';
import {
  accept,
  applyFit,
  baseChance,
  caseWorkerShare,
  chance,
  closeProposal,
  competence,
  decline,
  dealHand,
  fitOf,
  maxKr,
  maybePropose,
  odds,
  phaseOf,
  phaseOpen,
  pick,
  quality,
  readiness,
} from './proposals';
import { canBuy, identitiesShown, lineOpen, lineShown } from './institution';
import { newGame, newReferral } from './state';
import { tick } from './tick';
import { TICKS_PER_WEEK } from './time';

const ready = () => {
  const s = newGame();
  s.beds[0]!.overskudd = 30;
  s.beds[0]!.unlockedRung = 7; // NAV is open
  s.beds[0]!.lastProposalTick = -1e9;
  s.beds[0]!.identity = { primary: 'white' };
  return s;
};

/** Open a proposal and pick a card from the hand: NAV when it is there. */
const open = (s: ReturnType<typeof newGame>) => {
  maybePropose(s);
  const hand = s.proposal!.hand;
  pick(s, hand.includes('nav') ? 'nav' : hand[0]!);
};

describe('overskudd', () => {
  test('grows with the share of needs above the threshold', () => {
    const all = newGame();
    all.beds[0]!.needs = { food: 90, hygiene: 90, energy: 90, home: 90, social: 90 };
    const one = newGame();
    one.beds[0]!.needs = { ...all.beds[0]!.needs, food: 10 };
    const none = newGame();
    none.beds[0]!.needs = { food: 10, hygiene: 10, energy: 10, home: 10, social: 10 };
    for (const s of [all, one, none]) tick(s);
    expect(one.beds[0]!.overskudd).toBeGreaterThan(0);
    expect(one.beds[0]!.overskudd).toBeLessThan(all.beds[0]!.overskudd);
    expect(none.beds[0]!.overskudd).toBe(0);
  });
});

const nav = 'nav' as const;

describe('case worker', () => {
  const withCaseWorker = (level: number) => {
    const s = ready();
    s.staff = [
      {
        name: 'Kari',
        face: '🧑',
        role: 'caseworker',
        level,
        specialities: [],
        coaching: {},
        carry: 0,
      },
    ];
    return s;
  };

  test('supports the picked card, with no wager', () => {
    const s = withCaseWorker(2);
    s.budget = 500;
    const c = competence(s.beds[0]!, nav);
    // Before the roll: a failed try adds competence.
    const expected = chance(s.beds[0]!, nav, caseWorkerShare(2) * 600);
    open(s);
    expect(s.proposal?.caseWorker).toBe('Kari');
    expect(s.proposal?.outcome).toBeUndefined();
    expect(accept(s, 100)).toBe(false);
    expect(accept(s, 0)).toBe(true);
    const base = odds(c, 10);
    expect(s.proposal?.chance).toBeGreaterThan(base);
    expect(s.proposal?.chance).toBeCloseTo(expected);
    expect(s.proposal?.outcome).toMatch(/success|failure/);
    expect(s.budget).toBe(500);
    expect(s.beds[0]!.overskudd).toBe(30 - PROPOSAL_COST_MILESTONE);
  });

  test('each level prepares more, and lvl 5 stays short of the full price', () => {
    const shares = [1, 2, 3, 4, 5].map(caseWorkerShare);
    for (let i = 1; i < 5; i++) expect(shares[i]).toBeGreaterThan(shares[i - 1]!);
    expect(shares[4]).toBeLessThan(1);
  });

  test('odds are competence against difficulty', () => {
    expect(odds(10, 10)).toBe(0.5);
    expect(odds(30, 10)).toBe(0.75);
    expect(odds(0, 0)).toBe(1);
  });

  test('a failed try adds competence at the next try', () => {
    const s = ready();
    const before = competence(s.beds[0]!, nav);
    s.beds[0]!.attempts = { nav: 2 };
    expect(competence(s.beds[0]!, nav)).toBe(before + 2 * ATTEMPT_BONUS);
  });
});

describe('proposals', () => {
  test('a proposal opens and pauses the game, and only going costs overskudd', () => {
    const s = ready();
    s.speed = 2;
    open(s);
    expect(s.proposal).not.toBeNull();
    expect(s.speed).toBe(0);
    expect(s.beds[0]!.overskudd).toBe(30);
    accept(s, 0);
    expect(s.beds[0]!.overskudd).toBe(30 - PROPOSAL_COST_MILESTONE);
  });

  test('saying no costs no overskudd', () => {
    const s = ready();
    maybePropose(s);
    decline(s);
    expect(s.beds[0]!.overskudd).toBe(30);
  });

  test('no proposal during the cooldown', () => {
    const s = ready();
    s.beds[0]!.lastProposalTick = s.tick - (PROPOSAL_COOLDOWN_WEEKS * TICKS_PER_WEEK - 10);
    maybePropose(s);
    expect(s.proposal).toBeNull();
  });

  test('no proposal without enough overskudd', () => {
    const s = ready();
    s.beds[0]!.overskudd = PROPOSAL_COST_MILESTONE - 1;
    maybePropose(s);
    expect(s.proposal).toBeNull();
  });

  test('kroner raise the odds, a little less for each krone, and the full price is sure', () => {
    const s = ready();
    open(s);
    const r = s.beds[0]!;
    const subject = s.proposal!.pick!;
    expect(chance(r, subject, 0)).toBeCloseTo(baseChance(r, subject));
    const [c0, c1, c2] = [0, 100, 200].map((kr) => chance(r, subject, kr));
    expect(c1! - c0!).toBeGreaterThan(c2! - c1!);
    // Gentle: the second 100 kr still do at least two thirds of the first.
    expect(c2! - c1!).toBeGreaterThan((2 / 3) * (c1! - c0!));
    expect(chance(r, subject, maxKr(subject) - 1)).toBeLessThan(1);
    expect(chance(r, subject, maxKr(subject))).toBeCloseTo(1);
  });

  test('a wager costs kroner and rolls', () => {
    const s = ready();
    open(s);
    s.budget = 1000;
    expect(accept(s, 12.5)).toBe(false); // whole kroner only
    accept(s, 122);
    expect(s.budget).toBe(878);
    expect(s.proposal!.outcome).toMatch(/success|failure/);
    expect(s.proposal!.roll).toBeGreaterThanOrEqual(0);
  });

  test('no wager above the budget', () => {
    const s = ready();
    open(s);
    s.budget = 99.5;
    expect(accept(s, 100)).toBe(false);
    s.budget = 100;
    expect(accept(s, 100)).toBe(true);
  });

  test('a successful milestone is kept', () => {
    // Seeds are random. Try until one succeeds.
    for (let i = 0; i < 50; i++) {
      const s = ready();
      open(s);
      s.budget = 1000;
      accept(s, 300);
      if (s.proposal!.outcome !== 'success') continue;
      expect(s.beds[0]!.milestones).toEqual(['nav']);
      return;
    }
    throw new Error('no success in 50 tries');
  });

  test('closing resumes the old speed', () => {
    const s = ready();
    s.speed = 2;
    maybePropose(s);
    decline(s);
    closeProposal(s);
    expect(s.proposal).toBeNull();
    expect(s.speed).toBe(2);
  });

  test('phases open with the ladder, one success each', () => {
    const r = newGame().beds[0]!;
    expect(phaseOpen(r)).toBe(false);
    r.unlockedRung = 7;
    expect(phaseOf(r)).toBe('identity');
    expect(phaseOpen(r)).toBe(true);
    r.milestones.push('trip');
    expect(phaseOf(r)).toBe('mastery');
    expect(phaseOpen(r)).toBe(false);
    r.unlockedRung = 9;
    expect(phaseOpen(r)).toBe(true);
    r.milestones.push('piano');
    expect(phaseOf(r)).toBe('purpose');
    expect(phaseOpen(r)).toBe(false);
    for (const a of ACTIVITIES) r.skill[a.id] = MAX_SKILL;
    expect(phaseOpen(r)).toBe(true);
    r.milestones.push('job');
    expect(phaseOf(r)).toBeNull();
  });
});

describe('identity and fit', () => {
  test('the first patients have one colour each, all different', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = newGame();
      // Arvid and the first referral, then the next referral.
      s.waiting.push(newReferral(s, 'rolf'));
      const first = [s.beds[0]!.identity, ...s.waiting.map((p) => p.identity)];
      expect(first.every((id) => !id.secondary)).toBe(true);
      expect(new Set(first.map((id) => id.primary)).size).toBe(3);
    }
  });

  test('a single colour counts fully, a pair weights the primary', () => {
    expect(fitOf({ primary: 'red' }, 'trip')).toBe(MILESTONE_BY_ID.trip.fit.red);
    const pair = fitOf({ primary: 'red', secondary: 'white' }, 'trip');
    expect(pair).toBeCloseTo(0.6 * 3 + 0.4 * -2);
  });

  test('the hand holds the best and the worst fit of the phase', () => {
    const s = ready();
    const r = s.beds[0]!;
    r.identity = { primary: 'red' };
    for (let i = 0; i < 20; i++) {
      const hand = dealHand(s, r, 'identity');
      expect(hand).toHaveLength(3);
      expect(hand).toContain('trip');
      expect(hand).toContain('nav');
      expect(hand.every((id) => MILESTONE_BY_ID[id].phase === 'identity')).toBe(true);
    }
  });

  test('the last pick is prefilled for the same identity and phase', () => {
    const s = ready();
    s.levels.insight = 1;
    maybePropose(s);
    expect(s.proposal!.pick).toBeUndefined();
    pick(s, 'nav');
    accept(s, 0);
    closeProposal(s);
    s.beds[0]!.milestones = [];
    s.beds[0]!.overskudd = 30;
    s.beds[0]!.lastProposalTick = -1e9;
    maybePropose(s);
    expect(s.proposal!.pick).toBe('nav');
  });

  test('no prefill before the player can see identities', () => {
    const s = ready();
    open(s);
    accept(s, 0);
    closeProposal(s);
    s.beds[0]!.milestones = [];
    s.beds[0]!.overskudd = 30;
    s.beds[0]!.lastProposalTick = -1e9;
    maybePropose(s);
    expect(s.proposal!.pick).toBeUndefined();
  });

  test('each try is kept with its result, and the personality upgrade shows after the first', () => {
    const s = ready();
    expect(lineShown(s, 'insight')).toBe(false);
    expect(canBuy(s, 'insight')).toBe(false);
    open(s);
    accept(s, 0);
    const won = s.proposal!.outcome === 'success';
    expect(s.beds[0]!.tries).toEqual([{ id: s.proposal!.pick, won }]);
    expect(lineShown(s, 'insight')).toBe(true);
    s.budget = 1e6;
    expect(canBuy(s, 'insight')).toBe(true);
    expect(identitiesShown(s)).toBe(false);
    s.levels.insight = 1;
    expect(identitiesShown(s)).toBe(true);
    expect(lineOpen(s, 'insight')).toBe(false);
  });

  test('readiness follows the odds', () => {
    expect(readiness(0.8)).toBe('sure');
    expect(readiness(0.5)).toBe('unsure');
    expect(readiness(0.2)).toBe('doubt');
  });

  test('no going without a pick', () => {
    const s = ready();
    maybePropose(s);
    expect(accept(s, 0)).toBe(false);
  });

  test('a good purpose card raises the tax, nothing else does', () => {
    const r = newGame().beds[0]!;
    r.identity = { primary: 'white' };
    expect(quality(r)).toBe(1);
    r.milestones = ['nav', 'course'];
    expect(quality(r)).toBe(1);
    r.milestones = ['nav', 'course', 'volunteer'];
    expect(quality(r)).toBe(FIT_TAX_MULT);
    r.identity = { primary: 'black' };
    expect(quality(r)).toBe(1);
  });

  test('a good fit that works boosts overskudd, a poor fit strains whatever the roll', () => {
    const r = newGame().beds[0]!;
    r.identity = { primary: 'white' };
    r.strain = 0;
    expect(applyFit(r, 'nav', true)).toEqual({ kind: 'overskudd', boost: FIT_OVERSKUDD_BOOST });
    expect(applyFit(r, 'nav', false)).toBeUndefined();
    expect(r.boost).toBe(FIT_OVERSKUDD_BOOST);
    expect(applyFit(r, 'volunteer', true)).toEqual({ kind: 'tax', mult: FIT_TAX_MULT });
    expect(applyFit(r, 'trip', false)).toEqual({ kind: 'strain', strain: FIT_POOR_STRAIN });
    expect(applyFit(r, 'trip', true)?.kind).toBe('strain');
    expect(r.strain).toBeCloseTo(2 * FIT_POOR_STRAIN);
    expect(applyFit(r, 'therapist', true)).toBeUndefined(); // neutral for white
    expect(r.boost).toBe(FIT_OVERSKUDD_BOOST);
  });
});
