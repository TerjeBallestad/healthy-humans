import { describe, expect, test } from 'vitest';
import type { NeedId } from '../content/needs';
import {
  AD_WEEKS,
  CANDIDATES,
  CASEWORKER_MAX_LEVEL,
  WAGE_PER_LEVEL,
  COACH_TRAIN_COST,
  MAX_STAFF,
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
import {
  hireCost,
  wage,
  lineLevel,
  lineValue,
  nextStep,
  upgradeCost,
  netIncomePerWeek,
  omsorgCap,
  omsorgPerSecond,
  overskuddMult,
  staffNudgesPerSecond,
} from './institution';
import {
  caseworkCost,
  hire,
  postAd,
  rollCandidates,
  trainCasework,
  trainCoach,
  trainMestring,
  trainSpeciality,
  turnDown,
} from './staff';
import { newGame, type Staff } from './state';
import { isSeen } from './reveal';
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

  test('the funding line multiplies the grant', () => {
    const s = newGame();
    s.budget = 5000;
    expect(buyUpgrade(s, 'grant')).toBe(true);
    expect(netIncomePerWeek(s)).toBeCloseTo(GRANT_PER_WEEK * 1.5);
    s.levels.grant = 2;
    expect(netIncomePerWeek(s)).toBeCloseTo(GRANT_PER_WEEK * 2.25);
  });

  test('each extra bed adds to the grant, and the funding line multiplies it', () => {
    const s = newGame();
    s.budget = 10000;
    expect(buyBed(s)).toBe(true);
    expect(netIncomePerWeek(s)).toBe(GRANT_PER_WEEK + GRANT_PER_BED);
    s.levels.grant = 1;
    expect(netIncomePerWeek(s)).toBeCloseTo((GRANT_PER_WEEK + GRANT_PER_BED) * 1.5);
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
    expect(postAd(s, 'coach')).toBe(true);
    expect(s.budget).toBe(0);
    expect(postAd(s, 'worker')).toBe(false); // one ad at a time
    run(s, AD_WEEKS * TICKS_PER_WEEK - 1);
    expect(s.candidates).toHaveLength(0);
    tick(s);
    expect(s.candidates).toHaveLength(CANDIDATES);
    expect(s.candidates.every((c) => c.role === 'coach')).toBe(true);
  });

  test('picking someone costs only the wage of the role and closes the ad', () => {
    const s = newGame();
    rollCandidates(s, 'coach');
    const budget = s.budget;
    expect(hire(s, 0)).toBe(true);
    expect(s.budget).toBe(budget);
    expect(netIncomePerWeek(s)).toBe(GRANT_PER_WEEK - wage(s.staff[0]!));
    expect(s.candidates).toHaveLength(0);
    expect(hireCost(s)).toBeGreaterThan(HIRE_COST_BASE);
  });

  test('turning everyone down closes the ad', () => {
    const s = newGame();
    rollCandidates(s, 'worker');
    turnDown(s);
    expect(s.candidates).toHaveLength(0);
    s.budget = HIRE_COST_BASE;
    expect(postAd(s, 'worker')).toBe(true);
  });

  test('wages may not eat the whole grant', () => {
    const s = newGame();
    for (let i = 0; i < 10; i++) {
      rollCandidates(s, 'coach');
      hire(s, 0);
    }
    expect(netIncomePerWeek(s)).toBeGreaterThanOrEqual(0);
  });

  test('the house has MAX_STAFF office slots', () => {
    const s = newGame();
    s.budget = 1e9;
    s.levels.grant = 20;
    for (let i = 0; i < MAX_STAFF + 2; i++) {
      rollCandidates(s, 'worker');
      hire(s, 0);
    }
    expect(s.staff).toHaveLength(MAX_STAFF);
    expect(postAd(s, 'worker')).toBe(false);
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

describe('case worker', () => {
  test('candidates start at lvl 1 or 2', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = newGame();
      s.seed = seed;
      rollCandidates(s, 'caseworker');
      for (const c of s.candidates) expect([1, 2]).toContain(c.level);
    }
  });

  test('the casework course costs kroner, more each level, and raises the wage', () => {
    const s = newGame();
    s.staff = [{ ...coach({}), role: 'caseworker', level: 1 }];
    s.budget = 1e9;
    s.levels.grant = 20;
    const first = caseworkCost(s.staff[0]!);
    const before = wage(s.staff[0]!);
    expect(trainCasework(s, 0)).toBe(true);
    expect(s.staff[0]!.level).toBe(2);
    expect(wage(s.staff[0]!)).toBe(before + WAGE_PER_LEVEL.caseworker);
    expect(caseworkCost(s.staff[0]!)).toBeGreaterThan(first);
    while (trainCasework(s, 0));
    expect(s.staff[0]!.level).toBe(CASEWORKER_MAX_LEVEL);
  });
});

describe('wages', () => {
  test('a course may not push wages past the income', () => {
    const s = newGame();
    s.staff = [worker('Kari', ['food'])];
    s.omsorg = 40;
    s.budget = 0;
    // The base grant pays the wage, with less than one raise to spare.
    s.staff.push(...Array.from({ length: 2 }, () => coach({ eat: 1, shower: 1, sleep: 1 })));
    expect(netIncomePerWeek(s)).toBeLessThan(WAGE_PER_LEVEL.worker);
    expect(trainSpeciality(s, 0, 'hygiene')).toBe(false);
  });

  test('a candidate with a better sheet asks for more', () => {
    const plain = coach({ eat: 1, shower: 1, sleep: 1 });
    const strong = coach({ eat: 3, shower: 1, sleep: 1 });
    expect(wage(strong)).toBe(wage(plain) + 2 * WAGE_PER_LEVEL.coach);
  });
});

describe('upgrades', () => {
  test('a step costs budget, and each step costs more than the last', () => {
    const s = newGame();
    s.budget = 5000;
    expect(buyUpgrade(s, 'nudge')).toBe(true);
    expect(s.budget).toBe(4500);
    expect(lineLevel(s, 'nudge')).toBe(1);
    expect(upgradeCost(s, 'nudge')).toBe(1100);
    s.budget = 0;
    expect(buyUpgrade(s, 'nudge')).toBe(false);
  });

  test('rate lines multiply by 1.5 each step, and the cap adds 20', () => {
    expect(lineValue('staff', 2)).toBeCloseTo(2.25);
    expect(lineValue('omsorgCap', 3)).toBe(100);
  });

  test('the nudge line ends at 4 segments', () => {
    const s = newGame();
    s.budget = 1e6;
    for (let i = 0; i < 3; i++) expect(buyUpgrade(s, 'nudge')).toBe(true);
    expect(buyUpgrade(s, 'nudge')).toBe(false);
    expect(nudgeMultOf(s)).toBe(4);
  });

  test('rate lines have no end, and steps past the written ones get a number', () => {
    const s = newGame();
    expect(nextStep(s, 'house').label).toBe('Common room');
    s.levels.house = 1;
    expect(nextStep(s, 'house').label).toBe('Garden');
    s.levels.house = 2;
    expect(nextStep(s, 'house').label).toBe('Garden III');
  });

  test('the nudge line makes one nudge fill more segments, never past the bar', () => {
    const s = newGame();
    s.levels.nudge = 1;
    s.omsorg = 40;
    nudge(s, 0, 'eat');
    expect(s.beds[0]!.bars.eat).toBe(2);
    s.beds[0]!.bars.eat = 11;
    nudge(s, 0, 'eat');
    expect(s.beds[0]!.bars.eat).toBe(12);
  });

  test('the staff line makes staff faster', () => {
    const s = newGame();
    s.staff = [worker('Kari')];
    const before = staffNudgesPerSecond(s);
    s.levels.staff = 1;
    expect(staffNudgesPerSecond(s) / before).toBeCloseTo(1.5);
  });
});

const nudgeMultOf = (s: ReturnType<typeof newGame>) => lineValue('nudge', lineLevel(s, 'nudge'));

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

describe('overskudd', () => {
  test('the house line and the mestring course stack', () => {
    const s = newGame();
    s.budget = 5000;
    s.omsorg = 100;
    expect(overskuddMult(s)).toBe(1);
    s.levels.house = 1;
    expect(overskuddMult(s)).toBeCloseTo(1.5);
    s.staff.push(worker('A'), worker('B'));
    expect(trainMestring(s, 0)).toBe(true);
    expect(trainMestring(s, 0)).toBe(false);
    expect(trainMestring(s, 1)).toBe(true);
    expect(overskuddMult(s)).toBeCloseTo(1.5 * 1.5);
    expect(s.omsorg).toBe(20);
  });
});

describe('omsorg', () => {
  test('the rate and cap lines raise omsorg', () => {
    const s = newGame();
    const rate = omsorgPerSecond(s);
    s.levels.omsorgRate = 1;
    expect(omsorgPerSecond(s)).toBeCloseTo(rate * 1.5);
    expect(omsorgCap(s)).toBe(40);
    s.levels.omsorgCap = 1;
    expect(omsorgCap(s)).toBe(60);
    s.levels.omsorgCap = 2;
    expect(omsorgCap(s)).toBe(80);
  });
});

describe('reveal', () => {
  test('a new game hides the staff panel until a job ad is affordable', () => {
    const s = newGame();
    tick(s);
    expect(isSeen(s, 'staff')).toBe(false);
    s.budget = 400;
    tick(s);
    expect(isSeen(s, 'staff')).toBe(true);
    s.budget = 0;
    tick(s);
    expect(isSeen(s, 'staff')).toBe(true);
  });

  test('an old save without the list sees everything', () => {
    const s = newGame();
    delete s.seen;
    expect(isSeen(s, 'staff')).toBe(true);
    expect(isSeen(s, 'tip:nudge')).toBe(true);
  });
});
