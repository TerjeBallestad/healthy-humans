// All placeholder numbers live here. Tune in play.

/** Real seconds per game day at 1x speed. */
export const REAL_SECONDS_PER_DAY = 24;
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

/** Omsorg one nudge costs. */
export const OMSORG_PER_NUDGE = 1;
/** Effort: nudges to fill a bar, by skill level. 0 means automatic. */
export const BAR_SIZE_BY_SKILL = [12, 6, 3, 0] as const;

export function barSize(skill: number): number {
  return BAR_SIZE_BY_SKILL[Math.min(skill, BAR_SIZE_BY_SKILL.length - 1)] ?? 0;
}

/** Completions needed to gain one skill level. */
export const COMPLETIONS_PER_LEVEL = 5;
export const MAX_SKILL = BAR_SIZE_BY_SKILL.length - 1;
/** A ready activity (full bar or automatic) starts when its trigger need drops below this. */
export const READY_BELOW = 50;

/** How many rungs the resident is learning at the same time. */
export const LEARNING_WINDOW = 3;

/** Kommune grant in kr per game day. */
export const GRANT_PER_DAY = 120;
export const BUDGET_START = 0;
/** First recruitment fee. Each hire multiplies it. */
export const HIRE_COST_BASE = 400;
export const HIRE_COST_GROWTH = 1.5;
export const STAFF_WAGE_PER_DAY = 40;
/** Free nudges each staff member gives per game hour. */
export const STAFF_NUDGES_PER_HOUR = 0.75;

/** Overskudd gained per game hour while every active need is at or above the threshold. */
export const OVERSKUDD_PER_HOUR = 1;
export const OVERSKUDD_CAP = 60;
/** Overskudd a proposal needs and uses up. */
export const PROPOSAL_COST_SKILL = 12;
export const PROPOSAL_COST_MILESTONE = 20;
/** Shortest gap between two proposals. */
export const PROPOSAL_COOLDOWN_DAYS = 3;
/** Try-alone odds: base plus a bonus per skill level the resident has. */
export const TRY_ALONE_BASE = 0.35;
export const TRY_ALONE_PER_SKILL = 0.15;
/** Kroner the player can spend on a proposal, and the odds each step adds. */
export const SUPPORT_STEPS = [
  { kr: 0, bonus: 0 },
  { kr: 150, bonus: 0.2 },
  { kr: 350, bonus: 0.35 },
] as const;
export const MAX_CHANCE = 0.95;

/** A new person joins the waiting list this often. */
export const WAITLIST_DAYS_PER_PERSON = 3;
/** People on the list on day 1. */
export const WAITLIST_START = 1;
/** Start needs lost per day the next resident waited. */
export const WAIT_NEED_LOSS_PER_DAY = 2;
/** No start need drops below this. */
export const WAIT_NEED_FLOOR = 15;
/** Extra decay per day waited, as a fraction. Fades after arrival. */
export const WAIT_STRAIN_PER_DAY = 0.02;
export const WAIT_STRAIN_CAP = 0.5;
export const WAIT_STRAIN_FADE_PER_DAY = 0.05;
