import { describe, expect, test } from 'vitest';
import { GRANT_PER_DAY, HIRE_COST_BASE, OMSORG_CAP, STAFF_WAGE_PER_DAY } from '../content/tuning';
import { buyUpgrade, hire } from './actions';
import { canHire, hireCost, netIncomePerDay, omsorgCap } from './institution';
import { newGame } from './state';
import { tickMinute } from './tick';

const run = (s: ReturnType<typeof newGame>, minutes: number) => {
  for (let i = 0; i < minutes; i++) tickMinute(s);
};

describe('budget', () => {
  test('the grant arrives over the day', () => {
    const s = newGame();
    run(s, 1440);
    expect(s.budget).toBeCloseTo(GRANT_PER_DAY, 5);
  });
});

describe('staff', () => {
  test('hiring costs the fee and adds a wage', () => {
    const s = newGame();
    s.budget = HIRE_COST_BASE;
    expect(hire(s)).toBe(true);
    expect(s.budget).toBe(0);
    expect(netIncomePerDay(s)).toBe(GRANT_PER_DAY - STAFF_WAGE_PER_DAY);
    expect(hireCost(s)).toBeGreaterThan(HIRE_COST_BASE);
  });

  test('wages may not eat the whole grant', () => {
    const s = newGame();
    s.budget = 1e6;
    while (hire(s));
    expect(netIncomePerDay(s)).toBeGreaterThanOrEqual(0);
    expect(canHire(s)).toBe(false);
  });

  test('staff fill the bar of the lowest need for free', () => {
    const s = newGame();
    s.staff = ['Kari'];
    s.resident.needs.hygiene = 5;
    const omsorg = s.omsorg;
    run(s, 4 * 60);
    expect(s.resident.bars.shower).toBeGreaterThan(0);
    expect(s.resident.bars.eat).toBe(0);
    expect(s.omsorg).toBeGreaterThan(omsorg);
  });
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
