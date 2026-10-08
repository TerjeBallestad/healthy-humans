import { describe, expect, test } from 'vitest';
import { GRANT_PER_WEEK, HIRE_COST_BASE, OMSORG_CAP, STAFF_WAGE_PER_WEEK } from '../content/tuning';
import { buyUpgrade, hire } from './actions';
import { canHire, hireCost, netIncomePerWeek, omsorgCap } from './institution';
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
    s.resident.needs.hygiene = 5;
    const omsorg = s.omsorg;
    run(s, 8 * 60);
    expect(s.resident.bars.shower).toBeGreaterThan(0);
    expect(s.resident.bars.eat).toBe(0);
    expect(s.omsorg).toBeGreaterThan(omsorg);
  });
});

test('staff cannot make a rested resident sleep again', () => {
  const s = newGame();
  s.staff = ['Kari', 'Per', 'Lise'];
  s.resident.skill.sleep = 2;
  s.resident.needs.energy = 95;
  for (let i = 0; i < 4 * 60; i++) {
    tick(s);
    expect(s.resident.current?.id).not.toBe('sleep');
  }
});

describe('upgrades', () => {
  test('an upgrade costs budget and raises the cap once', () => {
    const s = newGame();
    s.budget = 1000;
    expect(buyUpgrade(s, 'rota')).toBe(true);
    expect(omsorgCap(s)).toBeGreaterThan(OMSORG_CAP);
    expect(buyUpgrade(s, 'rota')).toBe(false);
  });
});
