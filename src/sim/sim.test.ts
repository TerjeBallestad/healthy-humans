import { describe, expect, test } from 'vitest';
import { OMSORG_CAP, barSize } from '../content/tuning';
import { canNudge, nudge } from './actions';
import { activeNeeds } from './selectors';
import { newGame } from './state';
import { tickMinute } from './tick';

const run = (s: ReturnType<typeof newGame>, minutes: number) => {
  for (let i = 0; i < minutes; i++) tickMinute(s);
};

describe('needs', () => {
  test('only needs with an unlocked activity are active', () => {
    expect(activeNeeds(newGame().resident)).toEqual(['food', 'hygiene', 'energy']);
  });

  test('active needs decay, inactive needs stay', () => {
    const s = newGame();
    const before = { ...s.resident.needs };
    run(s, 60);
    expect(s.resident.needs.food).toBeLessThan(before.food);
    expect(s.resident.needs.home).toBe(before.home);
  });

  test('an empty need makes the others decay faster', () => {
    const calm = newGame();
    const spiral = newGame();
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
  test('a nudge spends one omsorg and fills the bar', () => {
    const s = newGame();
    const start = s.omsorg;
    expect(nudge(s, 'eat')).toBe(true);
    expect(s.omsorg).toBe(start - 1);
    expect(s.resident.bars.eat).toBe(1);
  });

  test('no nudge without omsorg', () => {
    const s = newGame();
    s.omsorg = 0.5;
    expect(canNudge(s, 'eat')).toBe(false);
  });

  test('a full bar starts the activity, which refills its need', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
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

  test('a full bar waits while the resident is busy', () => {
    const s = newGame();
    s.omsorg = OMSORG_CAP;
    for (let i = 0; i < 10; i++) nudge(s, 'eat');
    tickMinute(s);
    for (let i = 0; i < 10; i++) nudge(s, 'shower');
    run(s, 10);
    expect(s.resident.current?.id).toBe('eat');
    expect(s.resident.bars.shower).toBe(10);
    run(s, 25);
    expect(s.resident.current?.id).toBe('shower');
  });
});
