import { describe, expect, test } from 'vitest';
import {
  READY_BELOW,
  COMPLETIONS_PER_LEVEL,
  LEARNING_WINDOW,
  MAX_SKILL,
  OMSORG_CAP,
  OMSORG_PER_NUDGE,
  barSize,
} from '../content/tuning';
import { canNudge, nudge } from './actions';
import { activeNeeds } from './selectors';
import { newGame } from './state';
import { tickMinute } from './tick';

const run = (s: ReturnType<typeof newGame>, minutes: number) => {
  for (let i = 0; i < minutes; i++) tickMinute(s);
};

describe('needs', () => {
  test('only needs with an unlocked activity are active', () => {
    const s = newGame();
    expect(activeNeeds(s.resident)).toEqual(['food', 'hygiene', 'energy']);
    s.resident.unlockedRung = 1;
    expect(activeNeeds(s.resident)).toEqual(['food']);
  });

  test('active needs decay, inactive needs stay', () => {
    const s = newGame();
    const before = { ...s.resident.needs };
    run(s, 60);
    expect(s.resident.needs.food).toBeLessThan(before.food);
    expect(s.resident.needs.home).toBe(before.home);
    expect(s.resident.needs.social).toBe(before.social);
  });

  test('an empty need makes the others decay faster', () => {
    const calm = newGame();
    const spiral = newGame();
    calm.resident.unlockedRung = 3;
    spiral.resident.unlockedRung = 3;
    spiral.resident.needs.energy = 0;
    run(calm, 60);
    run(spiral, 60);
    expect(spiral.resident.needs.food).toBeLessThan(calm.resident.needs.food);
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
    expect(nudge(s, 'eat')).toBe(true);
    expect(s.omsorg).toBe(start - OMSORG_PER_NUDGE);
    expect(s.resident.bars.eat).toBe(1);
  });

  test('no nudge without omsorg', () => {
    const s = newGame();
    s.omsorg = OMSORG_PER_NUDGE - 0.5;
    expect(canNudge(s, 'eat')).toBe(false);
  });

  test('a full bar starts the activity when its need is low, and refills it', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.resident.needs.food = READY_BELOW - 5;
    for (let i = 0; i < barSize(0); i++) nudge(s, 'eat');
    expect(canNudge(s, 'eat')).toBe(false);
    tickMinute(s);
    expect(s.resident.current?.id).toBe('eat');
    expect(s.resident.bars.eat).toBe(0);
    const food = s.resident.needs.food;
    run(s, 30);
    expect(s.resident.current).toBeNull();
    expect(s.resident.needs.food).toBeGreaterThan(food + 30);
    expect(s.log[0]?.text).toBe('Ate.');
  });

  test('a full bar waits while the need is fine', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.resident.needs.food = 90;
    for (let i = 0; i < barSize(0); i++) nudge(s, 'eat');
    tickMinute(s);
    expect(s.resident.current).toBeNull();
    expect(s.resident.bars.eat).toBe(barSize(0));
  });

  test('a full bar holds one charge only', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.resident.needs.energy = 95;
    for (let i = 0; i < barSize(0); i++) nudge(s, 'sleep');
    expect(nudge(s, 'sleep')).toBe(false);
  });

  test('the lowest need goes first', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.resident.needs.food = 40;
    s.resident.needs.hygiene = 20;
    for (let i = 0; i < barSize(0); i++) nudge(s, 'eat');
    for (let i = 0; i < barSize(0); i++) nudge(s, 'shower');
    tickMinute(s);
    expect(s.resident.current?.id).toBe('shower');
  });

  test('a full bar waits while the resident is busy', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    s.resident.needs.food = 20;
    s.resident.needs.hygiene = 30;
    for (let i = 0; i < barSize(0); i++) nudge(s, 'eat');
    tickMinute(s);
    for (let i = 0; i < barSize(0); i++) nudge(s, 'shower');
    run(s, 10);
    expect(s.resident.current?.id).toBe('eat');
    expect(s.resident.bars.shower).toBe(barSize(0));
    run(s, 25);
    expect(s.resident.current?.id).toBe('shower');
  });
});

/** Nudge an activity until it starts, then run until it is done. */
const complete = (s: ReturnType<typeof newGame>, id: 'eat' | 'shower') => {
  s.omsorg = OMSORG_CAP;
  s.resident.needs[id === 'eat' ? 'food' : 'hygiene'] = 10;
  while (nudge(s, id));
  tickMinute(s);
  while (s.resident.current) tickMinute(s);
};

describe('skill and the ladder', () => {
  test('enough completions raise the skill and shrink the bar', () => {
    const s = newGame();
    for (let i = 0; i < COMPLETIONS_PER_LEVEL; i++) complete(s, 'eat');
    expect(s.resident.skill.eat).toBe(1);
    expect(barSize(s.resident.skill.eat)).toBeLessThan(barSize(0));
  });

  test('max skill makes the activity automatic and opens the next rung', () => {
    const s = newGame();
    for (let i = 0; i < COMPLETIONS_PER_LEVEL * MAX_SKILL; i++) complete(s, 'eat');
    expect(s.resident.skill.eat).toBe(MAX_SKILL);
    expect(canNudge(s, 'eat')).toBe(false);
    expect(s.resident.unlockedRung).toBe(LEARNING_WINDOW + 1);
    expect(activeNeeds(s.resident)).toContain('home');
  });

  test('an automatic activity starts when its need drops low', () => {
    const s = newGame();
    s.resident.skill.eat = MAX_SKILL;
    s.resident.needs.food = READY_BELOW - 1;
    tickMinute(s);
    expect(s.resident.current?.id).toBe('eat');
  });

  test('an automatic activity waits while the need is fine', () => {
    const s = newGame();
    s.resident.skill.eat = MAX_SKILL;
    s.resident.needs.food = 90;
    tickMinute(s);
    expect(s.resident.current).toBeNull();
  });
});
