export type MilestoneId = 'nav' | 'application' | 'worktrial';

export interface MilestoneDef {
  id: MilestoneId;
  label: string;
  /** The resident's proposal. First person. */
  ask: string;
  success: string;
  failure: string;
  baseChance: number;
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
    ask: 'I got a letter from NAV. I want to go to the meeting myself.',
    success: 'Went to NAV. Said what was needed. Came home with a plan.',
    failure: 'Sat in the waiting room. Left before the name was called.',
    baseChance: 0.45,
    needsRung: 7,
    forTier: 'fit for work',
  },
  {
    id: 'application',
    label: 'Job application',
    ask: "There's a job at the warehouse. Will you help me write to them?",
    success: 'Sent the application. Read it nine times first.',
    failure: 'Wrote two lines. Deleted them.',
    baseChance: 0.35,
    needsRung: 9,
    after: 'nav',
    forTier: 'fit for work',
  },
  {
    id: 'worktrial',
    label: 'Work trial',
    ask: 'They want me for a trial week. I think I want to go.',
    success: 'Five days at the warehouse. Came home tired. The good kind.',
    failure: 'Called in sick on Wednesday.',
    baseChance: 0.3,
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
