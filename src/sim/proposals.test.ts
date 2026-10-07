import { describe, expect, test } from 'vitest';
import { MAX_SKILL, PROPOSAL_COOLDOWN_DAYS, PROPOSAL_COST_SKILL, SUPPORT_STEPS } from '../content/tuning';
import { accept, chance, closeProposal, decline, eligibleSubjects, maybePropose } from './proposals';
import { newGame } from './state';
import { tickMinute } from './tick';

const ready = () => {
  const s = newGame();
  s.resident.overskudd = 30;
  s.lastProposalMinute = -1e9;
  return s;
};

describe('overskudd', () => {
  test('grows only while every need is above the threshold', () => {
    const s = newGame();
    s.resident.needs = { food: 90, hygiene: 90, energy: 90, home: 90, social: 90 };
    tickMinute(s);
    expect(s.resident.overskudd).toBeGreaterThan(0);
    const low = newGame();
    low.resident.needs.food = 10;
    tickMinute(low);
    expect(low.resident.overskudd).toBe(0);
  });
});

describe('proposals', () => {
  test('a proposal opens and pauses the game', () => {
    const s = ready();
    s.speed = 2;
    maybePropose(s);
    expect(s.proposal).not.toBeNull();
    expect(s.speed).toBe(0);
  });

  test('no proposal during the cooldown', () => {
    const s = ready();
    s.lastProposalMinute = s.minute - (PROPOSAL_COOLDOWN_DAYS * 1440 - 10);
    maybePropose(s);
    expect(s.proposal).toBeNull();
  });

  test('no proposal without enough overskudd', () => {
    const s = ready();
    s.resident.overskudd = PROPOSAL_COST_SKILL - 1;
    maybePropose(s);
    expect(s.proposal).toBeNull();
  });

  test('support costs kroner and raises the odds', () => {
    const s = ready();
    maybePropose(s);
    const subject = s.proposal!.subject;
    expect(chance(s.resident, subject, 2)).toBeGreaterThan(chance(s.resident, subject, 0));
    s.budget = 1000;
    accept(s, 2);
    expect(s.budget).toBe(1000 - SUPPORT_STEPS[2].kr);
    expect(s.resident.overskudd).toBe(30 - PROPOSAL_COST_SKILL);
    expect(s.proposal!.outcome).toMatch(/success|failure/);
    expect(s.proposal!.result).toBeTruthy();
  });

  test('a successful try raises the skill by one level', () => {
    // Seeds are random. Try until one succeeds.
    for (let i = 0; i < 50; i++) {
      const s = ready();
      maybePropose(s);
      const sub = s.proposal!.subject;
      if (sub.kind !== 'try') continue;
      s.budget = 1000;
      accept(s, 2);
      if (s.proposal!.outcome !== 'success') continue;
      expect(s.resident.skill[sub.activity]).toBe(1);
      expect(s.proposal!.gain).toContain('○○○ → ●○○');
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
    expect(eligibleSubjects(s.resident).some((x) => x.kind === 'milestone')).toBe(false);
    s.resident.unlockedRung = 7;
    const first = eligibleSubjects(s.resident)[0];
    expect(first).toEqual({ kind: 'milestone', milestone: 'nav' });
    s.resident.milestones.push('nav');
    s.resident.unlockedRung = 9;
    expect(eligibleSubjects(s.resident)[0]).toEqual({ kind: 'milestone', milestone: 'application' });
    s.resident.milestones.push('application');
    expect(eligibleSubjects(s.resident).some((x) => x.kind === 'milestone')).toBe(false);
    for (const id of Object.keys(s.resident.skill) as (keyof typeof s.resident.skill)[]) {
      s.resident.skill[id] = MAX_SKILL;
    }
    expect(eligibleSubjects(s.resident)[0]).toEqual({ kind: 'milestone', milestone: 'worktrial' });
  });
});
