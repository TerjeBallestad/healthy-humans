import { describe, expect, test } from 'vitest';
import { ACTIVITIES } from '../content/activities';
import { MAX_SKILL, PROPOSAL_COOLDOWN_WEEKS, PROPOSAL_COST_MILESTONE } from '../content/tuning';
import {
  accept,
  chance,
  closeProposal,
  decline,
  eligibleSubjects,
  maybePropose,
  surePrice,
} from './proposals';
import { newGame } from './state';
import { tick } from './tick';
import { TICKS_PER_WEEK } from './time';

const ready = () => {
  const s = newGame();
  s.beds[0]!.overskudd = 30;
  s.beds[0]!.unlockedRung = 7; // NAV is open
  s.beds[0]!.lastProposalTick = -1e9;
  return s;
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

describe('proposals', () => {
  test('a proposal opens and pauses the game, and only going costs overskudd', () => {
    const s = ready();
    s.speed = 2;
    maybePropose(s);
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

  test('kroner raise the odds, less for each krone, and the sure price is certain', () => {
    const s = ready();
    maybePropose(s);
    const r = s.beds[0]!;
    const subject = s.proposal!.subject;
    const sure = surePrice(subject);
    const [c0, c1, c2] = [0, 100, 200].map((kr) => chance(r, subject, kr));
    expect(c1! - c0!).toBeGreaterThan(c2! - c1!);
    expect(chance(r, subject, sure - 50)).toBeLessThan(1);
    expect(chance(r, subject, sure)).toBe(1);
  });

  test('a wager costs kroner and rolls', () => {
    const s = ready();
    maybePropose(s);
    s.budget = 1000;
    expect(accept(s, 12.5)).toBe(false); // whole kroner only
    accept(s, 122);
    expect(s.budget).toBe(878);
    expect(s.proposal!.outcome).toMatch(/success|failure/);
    expect(s.proposal!.roll).toBeGreaterThanOrEqual(0);
  });

  test('the sure price always works, and no wager above the budget', () => {
    const s = ready();
    maybePropose(s);
    const sure = surePrice(s.proposal!.subject);
    s.budget = sure - 0.5;
    expect(accept(s, sure)).toBe(false);
    s.budget = sure;
    accept(s, sure);
    expect(s.proposal!.outcome).toBe('success');
    expect(s.beds[0]!.milestones).toEqual(['nav']);
  });

  test('a successful milestone is kept', () => {
    // Seeds are random. Try until one succeeds.
    for (let i = 0; i < 50; i++) {
      const s = ready();
      maybePropose(s);
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

  test('milestones open with the ladder, in order', () => {
    const s = newGame();
    expect(eligibleSubjects(s.beds[0]!).some((x) => x.kind === 'milestone')).toBe(false);
    s.beds[0]!.unlockedRung = 7;
    const first = eligibleSubjects(s.beds[0]!)[0];
    expect(first).toEqual({ kind: 'milestone', milestone: 'nav' });
    s.beds[0]!.milestones.push('nav');
    s.beds[0]!.unlockedRung = 9;
    expect(eligibleSubjects(s.beds[0]!)[0]).toEqual({
      kind: 'milestone',
      milestone: 'application',
    });
    s.beds[0]!.milestones.push('application');
    expect(eligibleSubjects(s.beds[0]!).some((x) => x.kind === 'milestone')).toBe(false);
    const r = s.beds[0]!;
    for (const a of ACTIVITIES) r.skill[a.id] = MAX_SKILL;
    expect(eligibleSubjects(s.beds[0]!)[0]).toEqual({ kind: 'milestone', milestone: 'worktrial' });
  });
});
