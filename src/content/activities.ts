import type { NeedId } from './needs';

export type ActivityId = 'eat' | 'shower' | 'sleep';

export interface ActivityDef {
  id: ActivityId;
  /** Position on the ladder, starting at 1. */
  rung: number;
  label: string;
  /** Game minutes the activity takes. */
  duration: number;
  /** Total points added to each need over the duration. */
  refills: Partial<Record<NeedId, number>>;
  /** Status line while the resident does it. */
  doing: string;
  /** Log line when done. */
  done: string;
}

export const ACTIVITIES: ActivityDef[] = [
  {
    id: 'eat',
    rung: 1,
    label: 'Eat',
    duration: 30,
    refills: { food: 45 },
    doing: 'Eating something from the freezer.',
    done: 'Ate.',
  },
  {
    id: 'shower',
    rung: 2,
    label: 'Shower',
    duration: 20,
    refills: { hygiene: 70 },
    doing: 'In the shower.',
    done: 'Showered.',
  },
  {
    id: 'sleep',
    rung: 3,
    label: 'Sleep',
    duration: 8 * 60,
    refills: { energy: 90 },
    doing: 'Asleep.',
    done: 'Woke up.',
  },
];

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a])) as Record<
  ActivityId,
  ActivityDef
>;
