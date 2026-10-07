import { ACTIVITIES, type ActivityId } from '../content/activities';
import type { NeedId } from '../content/needs';
import {
  BUDGET_START,
  LEARNING_WINDOW,
  OMSORG_START,
  START_MINUTE_OF_DAY,
} from '../content/tuning';
import type { MilestoneId } from '../content/milestones';
import type { UpgradeId } from '../content/upgrades';

export const SAVE_VERSION = 6;

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
  overskudd: number;
  milestones: MilestoneId[];
}

export type ProposalSubject =
  | { kind: 'try'; activity: ActivityId }
  | { kind: 'milestone'; milestone: MilestoneId };

export interface Proposal {
  subject: ProposalSubject;
  /** Set once the player has chosen. */
  outcome?: 'success' | 'failure' | 'declined';
  /** What happened, in one line. */
  result?: string;
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
  /** Kroner. */
  budget: number;
  /** Names of hired staff. */
  staff: string[];
  /** Staff taps not yet spent, carried between minutes. */
  staffCarry: number;
  upgrades: UpgradeId[];
  resident: Resident;
  log: LogEntry[];
  /** Open proposal. The game is paused while it is set. */
  proposal: Proposal | null;
  /** Speed to return to when the proposal closes. */
  resumeSpeed: number;
  lastProposalMinute: number;
  seed: number;
}

const perActivity = (value: number) =>
  Object.fromEntries(ACTIVITIES.map((a) => [a.id, value])) as Record<ActivityId, number>;

export function newResident(): Resident {
  return {
    name: 'Arvid',
    intro: "41. Has not left his flat in a year. The curtains stay closed.",
    needs: { food: 70, hygiene: 55, energy: 80, home: 60, social: 50 },
    bars: perActivity(0),
    skill: perActivity(0),
    xp: perActivity(0),
    unlockedRung: LEARNING_WINDOW,
    current: null,
    overskudd: 0,
    milestones: [],
  };
}

export function newGame(): GameState {
  return {
    version: SAVE_VERSION,
    minute: START_MINUTE_OF_DAY,
    speed: 1,
    omsorg: OMSORG_START,
    budget: BUDGET_START,
    staff: [],
    staffCarry: 0,
    upgrades: [],
    resident: newResident(),
    log: [{ minute: START_MINUTE_OF_DAY, text: 'Arvid moves in. He brought one bag.' }],
    proposal: null,
    resumeSpeed: 1,
    lastProposalMinute: START_MINUTE_OF_DAY,
    seed: (Math.random() * 2 ** 32) | 0,
  };
}
