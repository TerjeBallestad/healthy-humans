export type MilestoneId = 'nav' | 'application' | 'worktrial';

export interface MilestoneDef {
  id: MilestoneId;
  label: string;
  /** The resident's proposal. First person. */
  ask: string;
  success: string;
  failure: string;
  baseChance: number;
  /** Kroner that make success sure. Smaller wagers give less, with diminishing returns. */
  sure: number;
  /** Where it happens, for the scene card. */
  place: string;
  placeIcon: string;
  /** Rung the resident must have reached. */
  needsRung: number;
  /** Milestone that must be done first. */
  after?: MilestoneId;
  /** Every routine must be automatic first. */
  needsAllRoutines?: boolean;
  /** The discharge tier this milestone is needed for. */
  forTier: string;
}

export const MILESTONES: MilestoneDef[] = [
  {
    id: 'nav',
    label: 'Meeting at NAV',
    ask: 'I want to go to the NAV meeting myself.',
    success: 'Went to NAV. Said what was needed. Came home with a plan.',
    failure: 'Sat in the waiting room. Left before the name was called.',
    baseChance: 0.45,
    sure: 600,
    place: 'NAV office',
    placeIcon: '🏢',
    needsRung: 7,
    forTier: 'fit for work',
  },
  {
    id: 'application',
    label: 'Job application',
    ask: 'There is a job at the warehouse. I want to apply.',
    success: 'Sent the application. Read it nine times first.',
    failure: 'Wrote two lines. Deleted them.',
    baseChance: 0.35,
    sure: 900,
    place: 'Kitchen table',
    placeIcon: '📝',
    needsRung: 9,
    after: 'nav',
    forTier: 'fit for work',
  },
  {
    id: 'worktrial',
    label: 'Work trial',
    ask: 'They want me for a trial week.',
    success: 'Five days at the warehouse. Came home tired. The good kind.',
    failure: 'Called in sick on Wednesday.',
    baseChance: 0.3,
    sure: 1400,
    place: 'Warehouse',
    placeIcon: '🏭',
    needsRung: 9,
    after: 'application',
    needsAllRoutines: true,
    forTier: 'healthy human',
  },
];

export const MILESTONE_BY_ID = Object.fromEntries(MILESTONES.map((m) => [m.id, m])) as Record<
  MilestoneId,
  MilestoneDef
>;
