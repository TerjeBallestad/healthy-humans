import { ACTIVITIES, type ActivityDef, type ActivityId } from '../content/activities';
import type { NeedId } from '../content/needs';
import {
  BUDGET_START,
  LEARNING_WINDOW,
  MAX_SKILL,
  OMSORG_START,
  WAIT_HEALTH_MAX,
  WAIT_HEALTH_MIN,
  WAIT_NEED_FLOOR,
  WAIT_NEED_LOSS_PER_HEALTH,
  WAIT_STRAIN_PER_HEALTH,
  WAITLIST_START,
} from '../content/tuning';
import { TRAITS, TRAIT_BY_ID, type TraitId } from '../content/traits';
import { random } from './rng';
import { rollCandidates } from './staff';
import { unlockedActivities } from './selectors';
import { ARCHETYPES, ARCHETYPE_BY_ID, type ArchetypeId } from '../content/archetypes';
import type { MilestoneId } from '../content/milestones';
import type { TierId } from '../content/tiers';
import type { StaffRole } from '../content/staff';
import type { UpgradeId } from '../content/upgrades';

export const SAVE_VERSION = 20;

export interface CurrentActivity {
  id: ActivityId;
  /** Game ticks left. */
  remaining: number;
}

export interface Resident {
  archetype: ArchetypeId;
  name: string;
  intro: string;
  trait: TraitId | null;
  needs: Record<NeedId, number>;
  /** Clicks put into each nudge bar. */
  bars: Record<ActivityId, number>;
  skill: Record<ActivityId, number>;
  /** Highest rung that is visible. */
  unlockedRung: number;
  current: CurrentActivity | null;
  overskudd: number;
  milestones: MilestoneId[];
  /** Health when they moved in, 0 to 100. */
  arrivalHealth: number;
  /** Extra need decay from poor health at arrival, as a fraction. Fades over time. */
  strain: number;
  /** When this resident last proposed something. */
  lastProposalTick: number;
  /** The last staff nudge on each activity, so the card can show it. */
  staffHit: Partial<Record<ActivityId, { tick: number; who: string }>>;
}

export interface Staff {
  name: string;
  role: StaffRole;
  /** Needs a miljøarbeider works on first, with a stronger nudge. */
  specialities: NeedId[];
  /** Highest level a coach can train, per activity. Missing means none. */
  coaching: Partial<Record<ActivityId, number>>;
  /** Nudges not yet given, carried between ticks. */
  carry: number;
}

export interface WaitingPerson {
  archetype: ArchetypeId;
  trait: TraitId;
  /** 0 to 100. Drops each week on the list. At 0 the person is lost. */
  health: number;
}

export type ProposalSubject = { kind: 'milestone'; milestone: MilestoneId };

export interface Proposal {
  /** The bed of the resident who proposes. */
  bed: number;
  subject: ProposalSubject;
  /** Overskudd the resident had when the proposal opened. The cost is paid on accept. */
  overskuddBefore: number;
  /** Kroner wagered and the chance it gave. Set once the player has chosen. */
  kr?: number;
  chance?: number;
  /** The roll, 0 to 1. Below the chance is a success. */
  roll?: number;
  /** Set once the player has chosen. */
  outcome?: 'success' | 'failure' | 'declined';
  /** What happened, in one line. */
  result?: string;
}

export interface Discharged {
  name: string;
  tier: TierId;
  /** Kroner per week, with the trait. */
  tax: number;
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
  staff: Staff[];
  /** People the player can hire. New ones every CANDIDATE_WEEKS. */
  candidates: Staff[];
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
  /** People who gave up waiting. */
  lost: number;
  log: LogEntry[];
  /** Open proposal. The game is paused while it is set. */
  proposal: Proposal | null;
  /** Speed to return to when a dialog closes. */
  resumeSpeed: number;
  seed: number;
}

const perActivity = (value: number) =>
  Object.fromEntries(ACTIVITIES.map((a) => [a.id, value])) as Record<ActivityId, number>;

/** A resident in poorer health arrives with lower needs and a strain on decay. */
export function newResident(
  id: ArchetypeId = 'arvid',
  health = 100,
  tick = 0,
  trait: TraitId | null = null,
): Resident {
  const a = ARCHETYPE_BY_ID[id];
  const skill = perActivity(0);
  const traitSkill = (trait && TRAIT_BY_ID[trait].startSkill) ?? {};
  for (const act of ACTIVITIES)
    skill[act.id] = Math.max(a.skills[act.id] ?? 0, traitSkill[act.id] ?? 0);
  const loss = (100 - health) * WAIT_NEED_LOSS_PER_HEALTH;
  const needs = Object.fromEntries(
    Object.entries(a.startNeeds).map(([n, v]) => [n, Math.max(WAIT_NEED_FLOOR, v - loss)]),
  ) as Record<NeedId, number>;
  const r: Resident = {
    archetype: id,
    name: a.name,
    intro: a.intro,
    trait,
    needs,
    bars: perActivity(0),
    skill,
    unlockedRung: 0,
    current: null,
    overskudd: 0,
    milestones: [],
    arrivalHealth: health,
    strain: (100 - health) * WAIT_STRAIN_PER_HEALTH,
    lastProposalTick: tick,
    staffHit: {},
  };
  fillLearningWindow(r);
  return r;
}

/** Open new rungs until the resident is learning LEARNING_WINDOW activities. Returns the new ones. */
export function fillLearningWindow(r: Resident): ActivityDef[] {
  const opened: ActivityDef[] = [];
  const learning = () => unlockedActivities(r).filter((a) => r.skill[a.id] < MAX_SKILL).length;
  while (learning() < LEARNING_WINDOW) {
    const next = ACTIVITIES.find((n) => n.rung === r.unlockedRung + 1);
    if (!next) break;
    r.unlockedRung = next.rung;
    opened.push(next);
  }
  return opened;
}

/** A new referral with a rolled trait and health. Advances the seed. */
export function newReferral(s: GameState, archetype: ArchetypeId): WaitingPerson {
  const trait = TRAITS[Math.floor(random(s) * TRAITS.length)]!.id;
  const health = WAIT_HEALTH_MIN + random(s) * (WAIT_HEALTH_MAX - WAIT_HEALTH_MIN);
  return { archetype, trait, health: Math.round(health) };
}

export function newGame(): GameState {
  const s: GameState = {
    version: SAVE_VERSION,
    tick: 0,
    speed: 1,
    omsorg: OMSORG_START,
    budget: BUDGET_START,
    staff: [],
    candidates: [],
    upgrades: [],
    beds: [newResident(ARCHETYPES[0]!.id)],
    selected: 0,
    nextArchetype: 1 + WAITLIST_START,
    discharged: [],
    discharge: null,
    waiting: [],
    lost: 0,
    log: [{ tick: 0, text: ARCHETYPES[0]!.arrives }],
    proposal: null,
    resumeSpeed: 1,
    seed: (Math.random() * 2 ** 32) | 0,
  };
  rollCandidates(s);
  for (let i = 0; i < WAITLIST_START; i++)
    s.waiting.push(newReferral(s, ARCHETYPES[(1 + i) % ARCHETYPES.length]!.id));
  return s;
}

/** The resident in the selected bed, or null when it is empty. */
export function selectedResident(s: GameState): Resident | null {
  return s.beds[s.selected] ?? null;
}

/** Every occupied bed with its index. */
export function occupied(s: GameState): [number, Resident][] {
  return s.beds.flatMap((r, i) => (r ? [[i, r] as [number, Resident]] : []));
}
