// All placeholder numbers live here. Tune in play.

/** Real seconds per calendar week at 1x speed. Activities have their own durations. */
export const SECONDS_PER_WEEK = 24;
export const SPEEDS = [0, 1, 2, 4] as const;
export const DEBUG_SPEEDS = [10, 100] as const;

export const OMSORG_PER_SECOND = 1.25;
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

export const MAX_SKILL = BAR_SIZE_BY_SKILL.length - 1;
/** Overskudd to train an activity one level up, by current level. Skill only grows this way. */
export const TRAIN_COST_BY_LEVEL = [8, 15, 25] as const;

export function trainCost(skill: number): number {
  return TRAIN_COST_BY_LEVEL[skill] ?? Infinity;
}
/** A ready activity (full bar or automatic) starts when its trigger need drops below this. */
export const READY_BELOW = 50;

/** How many rungs the resident is learning at the same time. */
export const LEARNING_WINDOW = 6;

/** Kommune grant in kr per week. */
export const GRANT_PER_WEEK = 120;
export const BUDGET_START = 0;
/** First extra bed. Each bed bought multiplies it. */
export const BED_COST_BASE = 1500;
export const BED_COST_GROWTH = 1.6;
export const MAX_BEDS = 4;
/** First recruitment fee. Each hire multiplies it. */
export const HIRE_COST_BASE = 400;
export const HIRE_COST_GROWTH = 1.5;
export const STAFF_WAGE_PER_WEEK = 40;
/** Free nudges each staff member gives per real second at 1x. */
export const STAFF_NUDGES_PER_SECOND = 0.75;

/** Overskudd per real second at 1x with every active need green. Scales with the green share. */
export const OVERSKUDD_PER_SECOND = 1;
export const OVERSKUDD_CAP = 60;
/** Overskudd a milestone proposal needs and uses up. */
export const PROPOSAL_COST_MILESTONE = 20;
/** Shortest gap between two proposals. */
export const PROPOSAL_COOLDOWN_WEEKS = 3;
/** Kroner the player can spend on a proposal, and the odds each step adds. */
export const SUPPORT_STEPS = [
  { kr: 0, bonus: 0 },
  { kr: 150, bonus: 0.2 },
  { kr: 350, bonus: 0.35 },
] as const;
export const MAX_CHANCE = 0.95;

/** A new person joins the waiting list this often. */
export const WAITLIST_WEEKS_PER_PERSON = 3;
/** People on the list on week 1. */
export const WAITLIST_START = 1;
/** Start needs lost per week the next resident waited. */
export const WAIT_NEED_LOSS_PER_WEEK = 2;
/** No start need drops below this. */
export const WAIT_NEED_FLOOR = 15;
/** Extra decay per week waited, as a fraction. Fades after arrival. */
export const WAIT_STRAIN_PER_WEEK = 0.02;
export const WAIT_STRAIN_CAP = 0.5;
export const WAIT_STRAIN_FADE_PER_WEEK = 0.05;
