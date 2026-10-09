import { describe, expect, test } from 'vitest';
import { ACTIVITIES } from '../content/activities';
import { GRANT_PER_WEEK, LEARNING_WINDOW, MAX_SKILL, barSize } from '../content/tuning';
import { admit, buyBed, freeBed } from './actions';
import {
  bestTier,
  cancelDischarge,
  closeDischarge,
  openDischarge,
  signDischarge,
  taxPerWeek,
  tierMissing,
} from './discharge';
import { netIncomePerWeek } from './institution';
import { maybePropose } from './proposals';
import { effort } from './selectors';
import { newGame, newResident, type Resident } from './state';
import { tick } from './tick';
import { TICKS_PER_WEEK } from './time';

const automatic = (r: Resident, upToRung: number) => {
  for (const a of ACTIVITIES) if (a.rung <= upToRung) r.skill[a.id] = MAX_SKILL;
  r.unlockedRung = Math.max(r.unlockedRung, upToRung);
};

describe('tiers', () => {
  test('none at the start', () => {
    expect(bestTier(newGame().beds[0]!)).toBeNull();
  });

  test('rungs 1 to 6 automatic opens "fit to live alone"', () => {
    const r = newGame().beds[0]!;
    automatic(r, 6);
    expect(bestTier(r)?.id).toBe('alone');
  });

  test('"fit for work" needs NAV, the application and every routine', () => {
    const r = newGame().beds[0]!;
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
    automatic(s.beds[0]!, 6);
    expect(openDischarge(s, 0)).toBe(true);
    expect(s.speed).toBe(0);
    cancelDischarge(s);
    expect(s.discharge).toBeNull();
    expect(s.speed).toBe(2);
  });

  test('signing adds tax and empties the bed; admitting fills it fresh', () => {
    const s = newGame();
    s.staff = [{ name: 'Kari', role: 'worker', specialities: [], coaching: {}, carry: 0 }];
    s.budget = 500;
    s.upgrades = ['calendar'];
    automatic(s.beds[0]!, 6);
    const before = netIncomePerWeek(s);
    openDischarge(s, 0);
    signDischarge(s);
    expect(netIncomePerWeek(s)).toBe(before + 10);
    closeDischarge(s);
    expect(s.discharge).toBeNull();
    expect(s.beds[0]).toBeNull();
    expect(admit(s, 0)).toBe(true);
    expect(s.beds[0]!.name).toBe('Maja');
    expect(s.beds[0]!.unlockedRung).toBe(LEARNING_WINDOW);
    const r = s.beds[0]!;
    expect(r.skill).toEqual(newResident('maja', 100, 0, r.trait).skill);
    expect(s.staff.map((x) => x.name)).toEqual(['Kari']);
    expect(s.budget).toBe(500);
    expect(s.upgrades).toHaveLength(1);
    expect(netIncomePerWeek(s)).toBe(GRANT_PER_WEEK - 40 + 10);
  });

  test('no proposal opens while the vedtak is open', () => {
    const s = newGame();
    automatic(s.beds[0]!, 6);
    s.beds[0]!.overskudd = 60;
    s.beds[0]!.lastProposalTick = -1e9;
    openDischarge(s, 0);
    maybePropose(s);
    expect(s.proposal).toBeNull();
  });
});

describe('beds', () => {
  test('a bought bed is empty and costs more each time', () => {
    const s = newGame();
    s.budget = 1e6;
    const before = s.budget;
    expect(buyBed(s)).toBe(true);
    const first = before - s.budget;
    expect(s.beds).toHaveLength(2);
    expect(s.beds[1]).toBeNull();
    expect(s.selected).toBe(1);
    const mid = s.budget;
    buyBed(s);
    expect(mid - s.budget).toBeGreaterThan(first);
  });

  test('two residents live side by side and share omsorg', () => {
    const s = newGame();
    s.budget = 1e6;
    buyBed(s);
    admit(s, 0);
    expect(s.beds.map((r) => r?.name)).toEqual(['Arvid', 'Maja']);
    const food = s.beds.map((r) => r!.needs.food);
    for (let i = 0; i < 60; i++) tick(s);
    expect(s.beds[0]!.needs.food).toBeLessThan(food[0]!);
    expect(s.beds[1]!.needs.food).toBeLessThan(food[1]!);
  });
});

describe('waiting list', () => {
  test('grows over time', () => {
    const s = newGame();
    const before = s.waiting.length;
    for (let i = 0; i < 3 * TICKS_PER_WEEK; i++) tick(s);
    expect(s.waiting.length).toBe(before + 1);
  });

  test('poor health means a worse start, and the strain fades', () => {
    const s = newGame();
    automatic(s.beds[0]!, 6);
    s.waiting[0]!.health = 60;
    openDischarge(s, 0);
    signDischarge(s);
    closeDischarge(s);
    const before = s.waiting.length;
    admit(s, 0);
    const r = s.beds[0]!;
    expect(s.waiting.length).toBe(before - 1);
    expect(r.arrivalHealth).toBe(60);
    expect(r.needs.food).toBe(60 - 20);
    expect(r.strain).toBeCloseTo(0.2);
    for (let i = 0; i < TICKS_PER_WEEK; i++) tick(s);
    expect(r.strain).toBeCloseTo(0.15);
  });

  test('each person on the list has their own archetype', () => {
    const s = newGame();
    for (let i = 0; i < 6 * TICKS_PER_WEEK; i++) tick(s);
    expect(s.waiting.map((p) => p.archetype)).toEqual(['maja', 'rolf', 'arvid']);
  });

  test('admitting needs a free bed', () => {
    const s = newGame();
    expect(freeBed(s)).toBe(-1);
    expect(admit(s, 0)).toBe(false);
  });

  test('no wait means no strain', () => {
    expect(newGame().beds[0]!.strain).toBe(0);
  });

  test('health drops on the list, and at 0 the person is lost', () => {
    const s = newGame();
    s.waiting[0]!.health = 50;
    for (let i = 0; i < TICKS_PER_WEEK; i++) tick(s);
    expect(s.waiting[0]!.health).toBeCloseTo(47);
    s.waiting[0]!.health = 0.001;
    tick(s);
    expect(s.waiting.length).toBe(0);
    expect(s.lost).toBe(1);
  });

  test('a trait comes with the person into the bed', () => {
    const s = newGame();
    s.budget = 10_000;
    buyBed(s);
    s.waiting[0]!.trait = 'cooks';
    admit(s, 0);
    const r = s.beds[1]!;
    expect(r.trait).toBe('cooks');
    expect(r.skill.eat).toBe(2);
    expect(r.skill.dishes).toBe(2);
    expect(r.skill.sleep).toBe(0);
  });

  test('each archetype arrives with its own skills and hard activities', () => {
    const r = newResident('rolf');
    expect(r.skill.groceries).toBe(3);
    expect(r.skill.eat).toBe(2);
    expect(effort(r, 'shower')).toBe(2 * barSize(0));
    expect(effort(r, 'sleep')).toBe(barSize(0));
  });

  test('a rich resident pays double tax', () => {
    const s = newGame();
    const r = s.beds[0]!;
    r.trait = 'rich';
    automatic(r, 6);
    openDischarge(s, 0);
    signDischarge(s);
    expect(taxPerWeek(s)).toBe(20);
  });
});

describe('tier text', () => {
  test('lists only the parts that are not done', () => {
    const r = newGame().beds[0]!;
    automatic(r, ACTIVITIES.length);
    r.milestones.push('nav');
    expect(tierMissing(r, 'work')).toEqual(['Job application']);
  });
});
