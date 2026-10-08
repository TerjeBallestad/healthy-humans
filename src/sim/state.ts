import { ACTIVITIES, type ActivityId } from '../content/activities';
import type { NeedId } from '../content/needs';
import {
  BUDGET_START,
  LEARNING_WINDOW,
  OMSORG_START,
  START_MINUTE_OF_DAY,
} from '../content/tuning';
import { ARCHETYPES, ARCHETYPE_BY_ID, type ArchetypeId } from '../content/archetypes';
import type { MilestoneId } from '../content/milestones';
import type { TierId } from '../content/tiers';
import type { UpgradeId } from '../content/upgrades';

export const SAVE_VERSION = 8;

export interface CurrentActivity {
  id: ActivityId;
  /** Game minutes left. */
  remaining: number;
}

export interface Resident {
  archetype: ArchetypeId;
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
  /** What the player gained, when it worked. */
  gain?: string;
}

export interface Discharged {
  name: string;
  tier: TierId;
  minute: number;
}

/** Open discharge dialog. The game is paused while it is set. */
export interface Discharge {
  tier: TierId;
  /** True once the vedtak is signed and the resident has left. */
  signed: boolean;
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
  /** Everyone discharged so far. Each one pays tax for the rest of the game. */
  discharged: Discharged[];
  discharge: Discharge | null;
  log: LogEntry[];
  /** Open proposal. The game is paused while it is set. */
  proposal: Proposal | null;
  /** Speed to return to when a dialog closes. */
  resumeSpeed: number;
  lastProposalMinute: number;
  seed: number;
}

const perActivity = (value: number) =>
  Object.fromEntries(ACTIVITIES.map((a) => [a.id, value])) as Record<ActivityId, number>;

export function newResident(id: ArchetypeId = 'arvid'): Resident {
  const a = ARCHETYPE_BY_ID[id];
  return {
    archetype: id,
    name: a.name,
    intro: a.intro,
    needs: { ...a.startNeeds },
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
    resident: newResident(ARCHETYPES[0]!.id),
    discharged: [],
    discharge: null,
    log: [{ minute: START_MINUTE_OF_DAY, text: ARCHETYPES[0]!.arrives }],
    proposal: null,
    resumeSpeed: 1,
    lastProposalMinute: START_MINUTE_OF_DAY,
    seed: (Math.random() * 2 ** 32) | 0,
  };
}
