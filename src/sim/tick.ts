import { ACTIVITY_BY_ID } from '../content/activities';
import { NEEDS } from '../content/needs';
import {
  NEED_THRESHOLD,
  OMSORG_CAP,
  OMSORG_PER_HOUR,
  SPIRAL_PER_EMPTY_NEED,
  barSize,
} from '../content/tuning';
import { activeNeeds, unlockedActivities } from './selectors';
import type { GameState } from './state';

const LOG_LIMIT = 30;

export function log(state: GameState, text: string) {
  state.log.unshift({ minute: state.minute, text });
  if (state.log.length > LOG_LIMIT) state.log.length = LOG_LIMIT;
}

/** Advance the sim by one game minute. */
export function tickMinute(state: GameState) {
  state.minute += 1;
  state.omsorg = Math.min(OMSORG_CAP, state.omsorg + OMSORG_PER_HOUR / 60);

  const r = state.resident;
  const needs = activeNeeds(r);
  const current = r.current ? ACTIVITY_BY_ID[r.current.id] : null;

  // Decay. Each empty need speeds up the others.
  for (const id of needs) {
    if (current?.refills[id] !== undefined) continue;
    const empty = needs.filter((n) => n !== id && r.needs[n] <= 0).length;
    const rate = (NEEDS[id].decayPerHour / 60) * (1 + empty * SPIRAL_PER_EMPTY_NEED);
    const before = r.needs[id];
    r.needs[id] = Math.max(0, before - rate);
    if (before >= NEED_THRESHOLD && r.needs[id] < NEED_THRESHOLD) {
      log(state, `${r.name} is ${NEEDS[id].lowState}.`);
    }
  }

  // Progress the current activity. Refills arrive spread over the duration.
  if (r.current && current) {
    for (const [id, amount] of Object.entries(current.refills)) {
      const need = id as keyof typeof r.needs;
      r.needs[need] = Math.min(100, r.needs[need] + amount / current.duration);
    }
    r.current.remaining -= 1;
    if (r.current.remaining <= 0) {
      r.current = null;
      log(state, current.done);
    }
  }

  // Start the first full bar when free.
  if (!r.current) {
    const ready = unlockedActivities(r).find((a) => r.bars[a.id] >= barSize(r.skill[a.id]));
    if (ready && barSize(r.skill[ready.id]) > 0) {
      r.bars[ready.id] = 0;
      r.current = { id: ready.id, remaining: ready.duration };
    }
  }
}
