import { describe, expect, test } from 'vitest';
import {
  GRANT_PER_WEEK,
  HIRE_COST_BASE,
  STAFF_NUDGES_PER_SECOND,
  STAFF_WAGE_PER_WEEK,
  trainCost,
} from '../content/tuning';
import { buyUpgrade, hire, nudge, toggleCoachStep } from './actions';
import { canHire, hireCost, netIncomePerWeek, staffNudgesPerSecond } from './institution';
import { newGame } from './state';
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
});

describe('staff', () => {
  test('hiring costs the fee and adds a wage', () => {
    const s = newGame();
    s.budget = HIRE_COST_BASE;
    expect(hire(s)).toBe(true);
    expect(s.budget).toBe(0);
    expect(netIncomePerWeek(s)).toBe(GRANT_PER_WEEK - STAFF_WAGE_PER_WEEK);
    expect(hireCost(s)).toBeGreaterThan(HIRE_COST_BASE);
  });

  test('wages may not eat the whole grant', () => {
    const s = newGame();
    s.budget = 1e6;
    while (hire(s));
    expect(netIncomePerWeek(s)).toBeGreaterThanOrEqual(0);
    expect(canHire(s)).toBe(false);
  });

  test('staff fill the bar of the lowest need for free', () => {
    const s = newGame();
    s.staff = ['Kari'];
    s.beds[0]!.needs.hygiene = 5;
    const omsorg = s.omsorg;
    run(s, 8 * 60);
    expect(s.beds[0]!.bars.shower).toBeGreaterThan(0);
    expect(s.beds[0]!.bars.eat).toBe(0);
    expect(s.omsorg).toBeGreaterThan(omsorg);
  });
});

test('staff cannot make a rested resident sleep again', () => {
  const s = newGame();
  s.staff = ['Kari', 'Per', 'Lise'];
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
    s.staff = ['Kari'];
    const before = staffNudgesPerSecond(s);
    s.upgrades = ['calendar'];
    expect(before).toBe(STAFF_NUDGES_PER_SECOND);
    expect(staffNudgesPerSecond(s)).toBe(STAFF_NUDGES_PER_SECOND * 1.5);
  });
});

describe('coach', () => {
  test('spends overskudd on the cheapest switched-on level', () => {
    const s = newGame();
    const r = s.beds[0]!;
    s.upgrades = ['coach1'];
    r.overskudd = trainCost(0);
    tick(s);
    expect(r.overskudd).toBeLessThan(1);
    expect(Object.values(r.skill).filter((v) => v === 1).length).toBe(2); // laundry started at 1
  });

  test('a switched-off level is left alone', () => {
    const s = newGame();
    const r = s.beds[0]!;
    s.upgrades = ['coach1', 'coach2'];
    toggleCoachStep(s, 1);
    r.overskudd = trainCost(0);
    tick(s);
    expect(r.skill.eat).toBe(0);
    r.overskudd = trainCost(1);
    tick(s);
    expect(r.skill.laundry).toBe(2);
  });
});
