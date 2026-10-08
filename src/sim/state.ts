import { ACTIVITIES, type ActivityId } from '../content/activities';
import type { NeedId } from '../content/needs';
import {
  BUDGET_START,
  LEARNING_WINDOW,
  OMSORG_START,
  WAIT_NEED_FLOOR,
  WAIT_NEED_LOSS_PER_WEEK,
  WAIT_STRAIN_CAP,
  WAIT_STRAIN_PER_WEEK,
  WAITLIST_START,
} from '../content/tuning';
import { ARCHETYPES, ARCHETYPE_BY_ID, type ArchetypeId } from '../content/archetypes';
import type { MilestoneId } from '../content/milestones';
import type { TierId } from '../content/tiers';
import type { UpgradeId } from '../content/upgrades';

export const SAVE_VERSION = 13;

export interface CurrentActivity {
  id: ActivityId;
  /** Game ticks left. */
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
  /** Highest rung that is visible. */
  unlockedRung: number;
  current: CurrentActivity | null;
  overskudd: number;
  milestones: MilestoneId[];
  /** Days on the waiting list before moving in. */
  waitedWeeks: number;
  /** Extra need decay from the wait, as a fraction. Fades over time. */
  strain: number;
  /** When this resident last proposed something. */
  lastProposalTick: number;
}

export interface WaitingPerson {
  archetype: ArchetypeId;
  /** The tick they joined the list. */
  joined: number;
}

export type ProposalSubject = { kind: 'milestone'; milestone: MilestoneId };

export interface Proposal {
  /** The bed of the resident who proposes. */
  bed: number;
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
  tick: number;
}

/** Open discharge dialog. The game is paused while it is set. */
export interface Discharge {
  bed: number;
  tier: TierId;
  /** True once the vedtak is signed and the resident has left. */
  signed: boolean;
}

export interface LogEntry {
  tick: number;
  /** The resident it is about, if any. */
  who?: string;
  text: string;
}

export interface GameState {
  version: number;
  /** Game ticks since the start. See time.ts. */
  tick: number;
  speed: number;
  omsorg: number;
  /** Kroner. */
  budget: number;
  /** Names of hired staff. */
  staff: string[];
  /** Staff taps not yet spent, carried between ticks. */
  staffCarry: number;
  upgrades: UpgradeId[];
  /** One slot per bed. Null is an empty bed. */
  beds: (Resident | null)[];
  /** The bed the player looks at. */
  selected: number;
  /** Index into ARCHETYPES for the next person who joins the waiting list. */
  nextArchetype: number;
  /** Everyone discharged so far. Each one pays tax for the rest of the game. */
  discharged: Discharged[];
  discharge: Discharge | null;
  /** First in line first. */
  waiting: WaitingPerson[];
  log: LogEntry[];
  /** Open proposal. The game is paused while it is set. */
  proposal: Proposal | null;
  /** Speed to return to when a dialog closes. */
  resumeSpeed: number;
  seed: number;
}

const perActivity = (value: number) =>
  Object.fromEntries(ACTIVITIES.map((a) => [a.id, value])) as Record<ActivityId, number>;

/** A resident who waited longer arrives with lower needs and a strain on decay. */
export function newResident(id: ArchetypeId = 'arvid', waitedWeeks = 0, tick = 0): Resident {
  const a = ARCHETYPE_BY_ID[id];
  const loss = waitedWeeks * WAIT_NEED_LOSS_PER_WEEK;
  const needs = Object.fromEntries(
    Object.entries(a.startNeeds).map(([n, v]) => [n, Math.max(WAIT_NEED_FLOOR, v - loss)]),
  ) as Record<NeedId, number>;
  return {
    archetype: id,
    name: a.name,
    intro: a.intro,
    needs,
    bars: perActivity(0),
    skill: perActivity(0),
    unlockedRung: LEARNING_WINDOW,
    current: null,
    overskudd: 0,
    milestones: [],
    waitedWeeks,
    strain: Math.min(WAIT_STRAIN_CAP, waitedWeeks * WAIT_STRAIN_PER_WEEK),
    lastProposalTick: tick,
  };
}

export function newGame(): GameState {
  return {
    version: SAVE_VERSION,
    tick: 0,
    speed: 1,
    omsorg: OMSORG_START,
    budget: BUDGET_START,
    staff: [],
    staffCarry: 0,
    upgrades: [],
    beds: [newResident(ARCHETYPES[0]!.id)],
    selected: 0,
    nextArchetype: 1 + WAITLIST_START,
    discharged: [],
    discharge: null,
    waiting: Array.from({ length: WAITLIST_START }, (_, i) => ({
      archetype: ARCHETYPES[(1 + i) % ARCHETYPES.length]!.id,
      joined: 0,
    })),
    log: [{ tick: 0, text: ARCHETYPES[0]!.arrives }],
    proposal: null,
    resumeSpeed: 1,
    seed: (Math.random() * 2 ** 32) | 0,
  };
}

/** The resident in the selected bed, or null when it is empty. */
export function selectedResident(s: GameState): Resident | null {
  return s.beds[s.selected] ?? null;
}

/** Every occupied bed with its index. */
export function occupied(s: GameState): [number, Resident][] {
  return s.beds.flatMap((r, i) => (r ? [[i, r] as [number, Resident]] : []));
}
