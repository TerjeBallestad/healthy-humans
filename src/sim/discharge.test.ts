import { describe, expect, test } from 'vitest';
import { ACTIVITIES } from '../content/activities';
import { GRANT_PER_WEEK, MAX_SKILL } from '../content/tuning';
import { admitNext, bestTier, cancelDischarge, openDischarge, signDischarge } from './discharge';
import { netIncomePerWeek } from './institution';
import { maybePropose } from './proposals';
import { newGame, type Resident } from './state';
import { tick } from './tick';
import { TICKS_PER_WEEK } from './time';

const automatic = (r: Resident, upToRung: number) => {
  for (const a of ACTIVITIES) if (a.rung <= upToRung) r.skill[a.id] = MAX_SKILL;
  r.unlockedRung = Math.max(r.unlockedRung, upToRung);
};

describe('tiers', () => {
  test('none at the start', () => {
    expect(bestTier(newGame().resident)).toBeNull();
  });

  test('rungs 1 to 6 automatic opens "fit to live alone"', () => {
    const r = newGame().resident;
    automatic(r, 6);
    expect(bestTier(r)?.id).toBe('alone');
  });

  test('"fit for work" needs NAV, the application and every routine', () => {
    const r = newGame().resident;
    automatic(r, 6);
    r.milestones = ['nav', 'application'];
    expect(bestTier(r)?.id).toBe('alone');
    automatic(r, 9);
    expect(bestTier(r)?.id).toBe('work');
    r.milestones.push('worktrial');
    expect(bestTier(r)?.id).toBe('healthy');
  });
});

describe('discharge', () => {
  test('pauses, can be cancelled, and resumes', () => {
    const s = newGame();
    s.speed = 2;
    automatic(s.resident, 6);
    expect(openDischarge(s)).toBe(true);
    expect(s.speed).toBe(0);
    cancelDischarge(s);
    expect(s.discharge).toBeNull();
    expect(s.speed).toBe(2);
  });

  test('signing adds tax, and the next resident starts fresh', () => {
    const s = newGame();
    s.staff = ['Kari'];
    s.budget = 500;
    s.upgrades = ['coffee'];
    automatic(s.resident, 6);
    const before = netIncomePerWeek(s);
    openDischarge(s);
    signDischarge(s);
    expect(netIncomePerWeek(s)).toBe(before + 10);
    admitNext(s);
    expect(s.discharge).toBeNull();
    expect(s.resident.name).toBe('Maja');
    expect(s.resident.unlockedRung).toBe(3);
    expect(Object.values(s.resident.skill).every((v) => v === 0)).toBe(true);
    expect(s.staff).toEqual(['Kari']);
    expect(s.budget).toBe(500);
    expect(s.upgrades).toHaveLength(1);
    expect(netIncomePerWeek(s)).toBe(GRANT_PER_WEEK - 40 + 10);
  });

  test('no proposal opens while the vedtak is open', () => {
    const s = newGame();
    automatic(s.resident, 6);
    s.resident.overskudd = 60;
    s.lastProposalTick = -1e9;
    openDischarge(s);
    maybePropose(s);
    expect(s.proposal).toBeNull();
  });
});

describe('waiting list', () => {
  test('grows over time', () => {
    const s = newGame();
    const before = s.waiting.length;
    for (let i = 0; i < 3 * TICKS_PER_WEEK; i++) tick(s);
    expect(s.waiting.length).toBe(before + 1);
  });

  test('a long wait means a worse start, and the strain fades', () => {
    const s = newGame();
    automatic(s.resident, 6);
    s.tick += 10 * TICKS_PER_WEEK;
    openDischarge(s);
    signDischarge(s);
    const before = s.waiting.length;
    admitNext(s);
    const r = s.resident;
    expect(s.waiting.length).toBe(before - 1);
    expect(r.waitedWeeks).toBe(10);
    expect(r.needs.food).toBe(60 - 20);
    expect(r.strain).toBeCloseTo(0.2);
    for (let i = 0; i < TICKS_PER_WEEK; i++) tick(s);
    expect(r.strain).toBeCloseTo(0.15);
  });

  test('no wait means no strain', () => {
    expect(newGame().resident.strain).toBe(0);
  });
});
