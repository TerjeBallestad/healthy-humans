import {
  ACTIVITIES,
  ACTIVITY_BY_ID,
  type ActivityDef,
  type ActivityId,
} from '../content/activities';
import { NEEDS, NEED_ORDER, type NeedId } from '../content/needs';
import { ARCHETYPE_BY_ID } from '../content/archetypes';
import { HARD_EFFORT, NEED_THRESHOLD, barSize } from '../content/tuning';
import type { Resident } from './state';

export function unlockedActivities(r: Resident): ActivityDef[] {
  return ACTIVITIES.filter((a) => a.rung <= r.unlockedRung);
}

/** Nudges to fill the bar at a skill level. 0 means automatic. Hard activities take more. */
export function effort(r: Resident, id: ActivityId, skill = r.skill[id]): number {
  const hard = ARCHETYPE_BY_ID[r.archetype].hard.includes(id);
  return barSize(skill) * (hard ? HARD_EFFORT : 1);
}

/** True when the effort is gone: the bar is full, or the activity is automatic. */
export function isReady(r: Resident, a: ActivityDef): boolean {
  const size = effort(r, a.id);
  return size === 0 || r.bars[a.id] >= size;
}

/**
 * Ready activities in the order the resident will do them: lowest need first.
 * Each one starts only when its need drops below READY_BELOW.
 * On the same need, a nudged activity goes before an automatic one: the player paid for it.
 */
export function readyQueue(r: Resident): ActivityDef[] {
  const auto = (a: ActivityDef) => (effort(r, a.id) === 0 ? 1 : 0);
  return unlockedActivities(r)
    .filter((a) => isReady(r, a))
    .sort((x, y) => r.needs[x.trigger] - r.needs[y.trigger] || auto(x) - auto(y));
}

/** A need is active once an unlocked activity can refill it. */
export function activeNeeds(r: Resident): NeedId[] {
  const refilled = new Set(unlockedActivities(r).flatMap((a) => Object.keys(a.refills)));
  return NEED_ORDER.filter((n) => refilled.has(n));
}

/** One plain line about what the resident is doing right now. */
export function statusLine(r: Resident): string {
  if (r.current) return ACTIVITY_BY_ID[r.current.id].doing;
  const worst = activeNeeds(r).sort((a, b) => r.needs[a] - r.needs[b])[0];
  if (worst && r.needs[worst] < NEED_THRESHOLD) return NEEDS[worst].idleLine;
  return 'Sitting on the sofa, phone in hand.';
}
