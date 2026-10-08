import { describe, expect, test } from 'vitest';
import { ACTIVITIES } from '../content/activities';
import { GRANT_PER_DAY, MAX_SKILL } from '../content/tuning';
import { admitNext, bestTier, cancelDischarge, openDischarge, signDischarge } from './discharge';
import { netIncomePerDay } from './institution';
import { maybePropose } from './proposals';
import { newGame, type Resident } from './state';

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
    const before = netIncomePerDay(s);
    openDischarge(s);
    signDischarge(s);
    expect(netIncomePerDay(s)).toBe(before + 10);
    admitNext(s);
    expect(s.discharge).toBeNull();
    expect(s.resident.name).toBe('Maja');
    expect(s.resident.unlockedRung).toBe(3);
    expect(Object.values(s.resident.skill).every((v) => v === 0)).toBe(true);
    expect(s.staff).toEqual(['Kari']);
    expect(s.budget).toBe(500);
    expect(s.upgrades).toHaveLength(1);
    expect(netIncomePerDay(s)).toBe(GRANT_PER_DAY - 40 + 10);
  });

  test('no proposal opens while the vedtak is open', () => {
    const s = newGame();
    automatic(s.resident, 6);
    s.resident.overskudd = 60;
    s.lastProposalMinute = -1e9;
    openDischarge(s);
    maybePropose(s);
    expect(s.proposal).toBeNull();
  });
});
