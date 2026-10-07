// All placeholder numbers live here. Tune in play.

/** Real seconds per game day at 1x speed. */
export const REAL_SECONDS_PER_DAY = 12;
export const SPEEDS = [0, 1, 2, 4] as const;
export const DEBUG_SPEEDS = [10, 100] as const;

/** Game time starts on day 1 at this minute of the day. */
export const START_MINUTE_OF_DAY = 7 * 60;

export const OMSORG_PER_HOUR = 1.25;
export const OMSORG_CAP = 40;
export const OMSORG_START = 20;

/** Below this value a need shows a state and blocks overskudd. */
export const NEED_THRESHOLD = 30;
/** Extra decay on every other need for each need sitting at 0. */
export const SPIRAL_PER_EMPTY_NEED = 0.25;

/** Clicks to fill a nudge bar, by skill level. 0 means automatic. */
export const BAR_SIZE_BY_SKILL = [12, 6, 3, 0] as const;

export function barSize(skill: number): number {
  return BAR_SIZE_BY_SKILL[Math.min(skill, BAR_SIZE_BY_SKILL.length - 1)] ?? 0;
}

/** Completions needed to gain one skill level. */
export const COMPLETIONS_PER_LEVEL = 5;
export const MAX_SKILL = BAR_SIZE_BY_SKILL.length - 1;
/** An automatic activity starts when its trigger need drops below this. */
export const AUTO_BELOW = 50;

/** How many rungs the resident is learning at the same time. */
export const LEARNING_WINDOW = 3;
