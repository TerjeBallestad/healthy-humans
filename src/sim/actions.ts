import type { ActivityId } from '../content/activities';
import { barSize } from '../content/tuning';
import type { GameState } from './state';

export function canNudge(state: GameState, id: ActivityId): boolean {
  const r = state.resident;
  const size = barSize(r.skill[id]);
  return size > 0 && state.omsorg >= 1 && r.bars[id] < size;
}

/** Spend one omsorg on an activity's nudge bar. */
export function nudge(state: GameState, id: ActivityId): boolean {
  if (!canNudge(state, id)) return false;
  state.omsorg -= 1;
  state.resident.bars[id] += 1;
  return true;
}
