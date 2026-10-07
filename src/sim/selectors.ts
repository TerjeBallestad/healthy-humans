import { ACTIVITIES, ACTIVITY_BY_ID, type ActivityDef } from '../content/activities';
import { NEEDS, NEED_ORDER, type NeedId } from '../content/needs';
import { NEED_THRESHOLD } from '../content/tuning';
import type { Resident } from './state';

export function unlockedActivities(r: Resident): ActivityDef[] {
  return ACTIVITIES.filter((a) => a.rung <= r.unlockedRung);
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
