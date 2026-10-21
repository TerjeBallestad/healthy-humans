import { describe, expect, it } from 'vitest';
import { LINES } from '../../src/content/upgrades';
import {
  bedCost as gameBedCost,
  hireCost as gameHireCost,
  lineValue as gameLineValue,
  upgradeCost,
} from '../../src/sim/institution';
import { newGame } from '../../src/sim/state';
import { defaultParams } from './params';
import { bedCost, hireCost, itemCurve, lineCost, lineValue, run } from './model';

describe('economy model', () => {
  const p = defaultParams();

  it('prices and values match the game', () => {
    const s = newGame();
    for (const l of LINES) {
      for (let n = 0; n < 6; n++) {
        s.levels[l.id] = n;
        expect(lineCost(p, l.id, n)).toBe(upgradeCost(s, l.id));
        expect(lineValue(p, l.id, n)).toBeCloseTo(gameLineValue(l.id, n));
      }
    }
    expect(bedCost(p, 1)).toBe(gameBedCost(s));
    expect(hireCost(p, 0)).toBe(gameHireCost(s));
  });

  it('a ×1.5 line on 2.2× costs gets about 1.47× worse per step', () => {
    const steps = itemCurve(p, 'grant').steps;
    expect(steps[1]!.perGain / steps[0]!.perGain).toBeCloseTo(2.2 / 1.5, 1);
  });

  it('runs, buys, discharges and pays tax', () => {
    const t = run(p);
    expect(t.purchases.length).toBeGreaterThan(5);
    expect(t.discharges.length).toBeGreaterThan(0);
    expect(t.samples.at(-1)!.tax).toBeGreaterThan(0);
  });
});
