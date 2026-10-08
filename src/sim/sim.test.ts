import { describe, expect, test } from 'vitest';
import {
  READY_BELOW,
  LEARNING_WINDOW,
  MAX_SKILL,
  OMSORG_CAP,
  OMSORG_PER_NUDGE,
  barSize,
  trainCost,
} from '../content/tuning';
import { canNudge, canTrain, nudge, train } from './actions';
import { activeNeeds } from './selectors';
import { newGame } from './state';
import { tick } from './tick';
import { TICKS_PER_SECOND } from './time';
import { ACTIVITY_BY_ID } from '../content/activities';

const EAT_TICKS = ACTIVITY_BY_ID.eat.duration * TICKS_PER_SECOND;

const run = (s: ReturnType<typeof newGame>, ticks: number) => {
  for (let i = 0; i < ticks; i++) tick(s);
};

describe('needs', () => {
  test('only needs with an unlocked activity are active', () => {
    const s = newGame();
    s.beds[0]!.unlockedRung = 3;
    expect(activeNeeds(s.beds[0]!)).toEqual(['food', 'hygiene', 'energy']);
    s.beds[0]!.unlockedRung = 1;
    expect(activeNeeds(s.beds[0]!)).toEqual(['food']);
  });

  test('active needs decay, inactive needs stay', () => {
    const s = newGame();
    s.beds[0]!.unlockedRung = 3;
    const before = { ...s.beds[0]!.needs };
    run(s, 60);
    expect(s.beds[0]!.needs.food).toBeLessThan(before.food);
    expect(s.beds[0]!.needs.home).toBe(before.home);
    expect(s.beds[0]!.needs.social).toBe(before.social);
  });

  test('an empty need makes the others decay faster', () => {
    const calm = newGame();
    const spiral = newGame();
    calm.beds[0]!.unlockedRung = 3;
    spiral.beds[0]!.unlockedRung = 3;
    spiral.beds[0]!.needs.energy = 0;
    run(calm, 60);
    run(spiral, 60);
    expect(spiral.beds[0]!.needs.food).toBeLessThan(calm.beds[0]!.needs.food);
  });
});

describe('omsorg', () => {
  test('builds up to the cap', () => {
    const s = newGame();
    run(s, 60 * 24 * 3);
    expect(s.omsorg).toBe(OMSORG_CAP);
  });
});

describe('nudges', () => {
  test('a nudge spends omsorg and fills the bar', () => {
    const s = newGame();
    const start = s.omsorg;
    expect(nudge(s, 0, 'eat')).toBe(true);
    expect(s.omsorg).toBe(start - OMSORG_PER_NUDGE);
    expect(s.beds[0]!.bars.eat).toBe(1);
  });

  test('no nudge without omsorg', () => {
    const s = newGame();
    s.omsorg = OMSORG_PER_NUDGE - 0.5;
    expect(canNudge(s, 0, 'eat')).toBe(false);
  });

  test('a full bar starts the activity when its need is low, and refills it', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.beds[0]!.needs.food = READY_BELOW - 5;
    for (let i = 0; i < barSize(0); i++) nudge(s, 0, 'eat');
    expect(canNudge(s, 0, 'eat')).toBe(false);
    tick(s);
    expect(s.beds[0]!.current?.id).toBe('eat');
    expect(s.beds[0]!.bars.eat).toBe(0);
    const food = s.beds[0]!.needs.food;
    run(s, EAT_TICKS);
    expect(s.beds[0]!.current).toBeNull();
    expect(s.beds[0]!.needs.food).toBeGreaterThan(food + 30);
    expect(s.log[0]?.text).toBe('Ate.');
  });

  test('a full bar waits while the need is fine', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.beds[0]!.needs.food = 90;
    for (let i = 0; i < barSize(0); i++) nudge(s, 0, 'eat');
    tick(s);
    expect(s.beds[0]!.current).toBeNull();
    expect(s.beds[0]!.bars.eat).toBe(barSize(0));
  });

  test('a full bar holds one charge only', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.beds[0]!.needs.energy = 95;
    for (let i = 0; i < barSize(0); i++) nudge(s, 0, 'sleep');
    expect(nudge(s, 0, 'sleep')).toBe(false);
  });

  test('the lowest need goes first', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.beds[0]!.needs.food = 40;
    s.beds[0]!.needs.hygiene = 20;
    for (let i = 0; i < barSize(0); i++) nudge(s, 0, 'eat');
    for (let i = 0; i < barSize(0); i++) nudge(s, 0, 'shower');
    tick(s);
    expect(s.beds[0]!.current?.id).toBe('shower');
  });

  test('a full bar waits while the resident is busy', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.beds[0]!.needs.food = 20;
    s.beds[0]!.needs.hygiene = 30;
    for (let i = 0; i < barSize(0); i++) nudge(s, 0, 'eat');
    tick(s);
    for (let i = 0; i < barSize(0); i++) nudge(s, 0, 'shower');
    run(s, EAT_TICKS / 2);
    expect(s.beds[0]!.current?.id).toBe('eat');
    expect(s.beds[0]!.bars.shower).toBe(barSize(0));
    run(s, EAT_TICKS / 2 + 1);
    expect(s.beds[0]!.current?.id).toBe('shower');
  });
});

describe('skill and the ladder', () => {
  test('completing an activity gives no skill', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.beds[0]!.needs.food = 10;
    while (nudge(s, 0, 'eat'));
    run(s, EAT_TICKS + 1);
    expect(s.log.some((e) => e.text === 'Ate.')).toBe(true);
    expect(s.beds[0]!.skill.eat).toBe(0);
  });

  test('training spends overskudd and shrinks the bar', () => {
    const s = newGame();
    s.beds[0]!.overskudd = trainCost(0);
    expect(train(s, 0, 'eat')).toBe(true);
    expect(s.beds[0]!.overskudd).toBe(0);
    expect(s.beds[0]!.skill.eat).toBe(1);
    expect(barSize(1)).toBeLessThan(barSize(0));
    expect(train(s, 0, 'eat')).toBe(false);
  });

  test('a locked activity cannot be trained', () => {
    const s = newGame();
    s.beds[0]!.overskudd = 999;
    expect(train(s, 0, 'call')).toBe(false);
  });

  test('max skill makes the activity automatic and opens the next rung', () => {
    const s = newGame();
    s.beds[0]!.overskudd = 999;
    for (let i = 0; i < MAX_SKILL; i++) train(s, 0, 'eat');
    expect(s.beds[0]!.skill.eat).toBe(MAX_SKILL);
    expect(canNudge(s, 0, 'eat')).toBe(false);
    expect(canTrain(s, 0, 'eat')).toBe(false);
    expect(s.beds[0]!.unlockedRung).toBe(LEARNING_WINDOW + 1);
  });

  test('an automatic activity starts when its need drops low', () => {
    const s = newGame();
    s.beds[0]!.skill.eat = MAX_SKILL;
    s.beds[0]!.needs.food = READY_BELOW - 1;
    tick(s);
    expect(s.beds[0]!.current?.id).toBe('eat');
  });

  test('an automatic activity waits while the need is fine', () => {
    const s = newGame();
    s.beds[0]!.skill.eat = MAX_SKILL;
    s.beds[0]!.needs.food = 90;
    tick(s);
    expect(s.beds[0]!.current).toBeNull();
  });
});
