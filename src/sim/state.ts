import { ACTIVITIES, type ActivityId } from '../content/activities';
import type { NeedId } from '../content/needs';
import { OMSORG_START, START_MINUTE_OF_DAY } from '../content/tuning';

export const SAVE_VERSION = 2;

export interface CurrentActivity {
  id: ActivityId;
  /** Game minutes left. */
  remaining: number;
}

export interface Resident {
  name: string;
  intro: string;
  needs: Record<NeedId, number>;
  /** Clicks put into each nudge bar. */
  bars: Record<ActivityId, number>;
  skill: Record<ActivityId, number>;
  /** Completions toward the next skill level. */
  xp: Record<ActivityId, number>;
  /** Highest rung that is visible. */
  unlockedRung: number;
  current: CurrentActivity | null;
}

export interface LogEntry {
  minute: number;
  text: string;
}

export interface GameState {
  version: number;
  /** Game minutes since the start of day 1. */
  minute: number;
  speed: number;
  omsorg: number;
  resident: Resident;
  log: LogEntry[];
}

const perActivity = (value: number) =>
  Object.fromEntries(ACTIVITIES.map((a) => [a.id, value])) as Record<ActivityId, number>;

export function newResident(): Resident {
  return {
    name: 'Arvid',
    intro: "41. Has not left his flat in a year. The curtains stay closed.",
    needs: { food: 35, hygiene: 35, energy: 50, home: 40, social: 35 },
    bars: perActivity(0),
    skill: perActivity(0),
    xp: perActivity(0),
    unlockedRung: 1,
    current: null,
  };
}

export function newGame(): GameState {
  return {
    version: SAVE_VERSION,
    minute: START_MINUTE_OF_DAY,
    speed: 1,
    omsorg: OMSORG_START,
    resident: newResident(),
    log: [{ minute: START_MINUTE_OF_DAY, text: 'Arvid moves in. He brought one bag.' }],
  };
}
