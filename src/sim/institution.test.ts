import { describe, expect, test } from 'vitest';
import type { NeedId } from '../content/needs';
import {
  AD_WEEKS,
  CANDIDATES,
  COACH_TRAIN_COST,
  ROLES,
  SPECIALITY_FILL,
  SPECIALITY_TRAIN_COST,
} from '../content/staff';
import {
  GRANT_PER_BED,
  GRANT_PER_WEEK,
  HIRE_COST_BASE,
  PROPOSAL_COST_MILESTONE,
  trainCost,
} from '../content/tuning';
import { buyBed, buyUpgrade, nudge } from './actions';
import { hireCost, netIncomePerWeek, staffNudgesPerSecond } from './institution';
import { hire, postAd, rollCandidates, trainCoach, trainSpeciality, turnDown } from './staff';
import { newGame, type Staff } from './state';
import { tick } from './tick';
import { TICKS_PER_WEEK } from './time';

const run = (s: ReturnType<typeof newGame>, ticks: number) => {
  for (let i = 0; i < ticks; i++) tick(s);
};

describe('budget', () => {
  test('the grant arrives over the day', () => {
    const s = newGame();
    run(s, TICKS_PER_WEEK);
    expect(s.budget).toBeCloseTo(GRANT_PER_WEEK, 5);
  });

  test('the funding line multiplies the grant, in order', () => {
    const s = newGame();
    s.budget = 5000;
    expect(buyUpgrade(s, 'application')).toBe(false);
    expect(buyUpgrade(s, 'report')).toBe(true);
    expect(netIncomePerWeek(s)).toBe(GRANT_PER_WEEK * 1.5);
    expect(buyUpgrade(s, 'application')).toBe(true);
    expect(netIncomePerWeek(s)).toBe(GRANT_PER_WEEK * 2);
  });

  test('each extra bed adds to the grant, and the funding line multiplies it', () => {
    const s = newGame();
    s.budget = 10000;
    expect(buyBed(s)).toBe(true);
    expect(netIncomePerWeek(s)).toBe(GRANT_PER_WEEK + GRANT_PER_BED);
    expect(buyUpgrade(s, 'report')).toBe(true);
    expect(netIncomePerWeek(s)).toBe((GRANT_PER_WEEK + GRANT_PER_BED) * 1.5);
  });
});

const worker = (name: string, specialities: NeedId[] = []): Staff => ({
  name,
  face: '🧑',
  role: 'worker',
  specialities,
  coaching: {},
  carry: 0,
});
const coach = (coaching: Staff['coaching']): Staff => ({
  name: 'Coach',
  face: '🧑',
  role: 'coach',
  specialities: [],
  coaching,
  carry: 0,
});

describe('staff', () => {
  test('a job ad costs the fee, and candidates show up a week later', () => {
    const s = newGame();
    s.budget = HIRE_COST_BASE;
    expect(postAd(s)).toBe(true);
    expect(s.budget).toBe(0);
    expect(postAd(s)).toBe(false); // one ad at a time
    run(s, AD_WEEKS * TICKS_PER_WEEK - 1);
    expect(s.candidates).toHaveLength(0);
    tick(s);
    expect(s.candidates).toHaveLength(CANDIDATES);
  });

  test('picking someone costs only the wage of the role and closes the ad', () => {
    const s = newGame();
    rollCandidates(s);
    s.candidates[0]!.role = 'coach';
    const budget = s.budget;
    expect(hire(s, 0)).toBe(true);
    expect(s.budget).toBe(budget);
    expect(netIncomePerWeek(s)).toBe(GRANT_PER_WEEK - ROLES.coach.wage);
    expect(s.candidates).toHaveLength(0);
    expect(hireCost(s)).toBeGreaterThan(HIRE_COST_BASE);
  });

  test('turning everyone down closes the ad', () => {
    const s = newGame();
    rollCandidates(s);
    turnDown(s);
    expect(s.candidates).toHaveLength(0);
    s.budget = HIRE_COST_BASE;
    expect(postAd(s)).toBe(true);
  });

  test('wages may not eat the whole grant', () => {
    const s = newGame();
    for (let i = 0; i < 10; i++) {
      rollCandidates(s);
      hire(s, 0);
    }
    expect(netIncomePerWeek(s)).toBeGreaterThanOrEqual(0);
  });

  test('staff fill the bar of the lowest need for free', () => {
    const s = newGame();
    s.staff = [worker('Kari')];
    s.beds[0]!.needs.hygiene = 5;
    const omsorg = s.omsorg;
    run(s, 8 * 60);
    expect(s.beds[0]!.bars.shower).toBeGreaterThan(0);
    expect(s.beds[0]!.bars.eat).toBe(0);
    expect(s.omsorg).toBeGreaterThan(omsorg);
  });

  test('a speciality comes first and fills more', () => {
    const s = newGame();
    s.staff = [worker('Kari', ['food'])];
    s.staff[0]!.carry = 0.999;
    s.beds[0]!.needs.hygiene = 5;
    s.beds[0]!.needs.food = 90;
    tick(s);
    expect(s.beds[0]!.bars.eat).toBe(SPECIALITY_FILL);
    expect(s.beds[0]!.bars.shower).toBe(0);
  });

  test('training costs omsorg', () => {
    const s = newGame();
    s.staff = [worker('Kari', ['food']), coach({ eat: 1 })];
    s.omsorg = 40;
    expect(trainSpeciality(s, 0, 'food')).toBe(false);
    expect(trainSpeciality(s, 0, 'hygiene')).toBe(true);
    expect(s.omsorg).toBe(40 - SPECIALITY_TRAIN_COST);
    s.omsorg = 40;
    expect(trainCoach(s, 1, 'eat')).toBe(true);
    expect(s.staff[1]!.coaching.eat).toBe(2);
    expect(s.omsorg).toBe(40 - COACH_TRAIN_COST[1]);
  });
});

test('staff cannot make a rested resident sleep again', () => {
  const s = newGame();
  s.staff = [worker('Kari'), worker('Per'), worker('Lise')];
  s.beds[0]!.skill.sleep = 2;
  s.beds[0]!.needs.energy = 95;
  for (let i = 0; i < 4 * 60; i++) {
    tick(s);
    expect(s.beds[0]!.current?.id).not.toBe('sleep');
  }
});

describe('upgrades', () => {
  test('an upgrade costs budget, is bought once, and the next rung needs the first', () => {
    const s = newGame();
    s.budget = 5000;
    expect(buyUpgrade(s, 'supervision')).toBe(false);
    expect(buyUpgrade(s, 'course')).toBe(true);
    expect(s.budget).toBe(4500);
    expect(buyUpgrade(s, 'course')).toBe(false);
    expect(buyUpgrade(s, 'supervision')).toBe(true);
  });

  test('the course makes one nudge fill two segments, never past the bar', () => {
    const s = newGame();
    s.upgrades = ['course'];
    s.omsorg = 40;
    nudge(s, 0, 'eat');
    expect(s.beds[0]!.bars.eat).toBe(2);
    s.beds[0]!.bars.eat = 11;
    nudge(s, 0, 'eat');
    expect(s.beds[0]!.bars.eat).toBe(12);
  });

  test('the calendar makes staff faster', () => {
    const s = newGame();
    s.staff = [worker('Kari')];
    const before = staffNudgesPerSecond(s);
    s.upgrades = ['calendar'];
    expect(staffNudgesPerSecond(s) / before).toBeCloseTo(1.5);
  });
});

describe('coach', () => {
  test('spends overskudd only on levels a coach can teach', () => {
    const s = newGame();
    const r = s.beds[0]!;
    s.staff = [coach({ shower: 1 })];
    r.overskudd = trainCost(0) * 2;
    tick(s);
    expect(r.skill.shower).toBe(1);
    expect(r.skill.eat).toBe(0);
    expect(r.overskudd).toBeLessThan(trainCost(0) + 1);
  });

  test('keeps enough overskudd for a proposal while a milestone is open', () => {
    const s = newGame();
    const r = s.beds[0]!;
    s.staff = [coach({ eat: 1 })];
    r.unlockedRung = 7; // NAV is open
    r.overskudd = PROPOSAL_COST_MILESTONE + trainCost(0) - 1;
    tick(s);
    expect(r.skill.eat).toBe(0);
    r.overskudd = PROPOSAL_COST_MILESTONE + trainCost(0) + 1;
    r.lastProposalTick = s.tick; // no proposal this tick
    tick(s);
    expect(r.skill.eat).toBe(1);
    expect(r.overskudd).toBeGreaterThanOrEqual(PROPOSAL_COST_MILESTONE);
  });
});
