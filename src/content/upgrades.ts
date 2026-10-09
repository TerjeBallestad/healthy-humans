export type UpgradeId =
  'course' | 'supervision' | 'calendar' | 'handover' | 'coach1' | 'coach2' | 'coach3';

export interface UpgradeDef {
  id: UpgradeId;
  label: string;
  /** One dry line under the name. */
  note: string;
  /** What it does, in a few words. */
  effect: string;
  cost: number;
  /** Must be bought first. */
  after?: UpgradeId;
  /** Segments one of your own nudges fills. The highest bought wins. */
  nudgeMult?: number;
  /** Multiplies staff nudges. The highest bought wins. */
  staffMult?: number;
  /** The coach can train to this level. */
  coachStep?: number;
}

// Two ways to grow: make your own click stronger, or build the machine that clicks for you.
export const UPGRADES: UpgradeDef[] = [
  {
    id: 'course',
    label: 'Course in motivational interviewing',
    note: 'Two days at a hotel in Lillestrøm.',
    effect: 'Your nudges fill 2 segments',
    cost: 500,
    nudgeMult: 2,
  },
  {
    id: 'supervision',
    label: 'Supervision group',
    note: 'Every second Thursday. There are buns.',
    effect: 'Your nudges fill 3 segments',
    cost: 1500,
    after: 'course',
    nudgeMult: 3,
  },
  {
    id: 'calendar',
    label: 'Shared calendar',
    note: 'Nobody books the same room twice.',
    effect: 'Staff work 50% faster',
    cost: 600,
    staffMult: 1.5,
  },
  {
    id: 'handover',
    label: 'Handover routine',
    note: 'Ten minutes at every shift change. Written down.',
    effect: 'Staff work twice as fast',
    cost: 1600,
    after: 'calendar',
    staffMult: 2,
  },
  {
    id: 'coach1',
    label: 'Coach: lvl 1',
    note: 'Someone who knows how to start small.',
    effect: 'Spends overskudd on lvl 1',
    cost: 400,
    coachStep: 1,
  },
  {
    id: 'coach2',
    label: 'Coach: lvl 2',
    note: '',
    effect: 'Spends overskudd on lvl 2',
    cost: 900,
    after: 'coach1',
    coachStep: 2,
  },
  {
    id: 'coach3',
    label: 'Coach: independent',
    note: '',
    effect: 'Spends overskudd on the last level',
    cost: 1400,
    after: 'coach2',
    coachStep: 3,
  },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u])) as Record<
  UpgradeId,
  UpgradeDef
>;

export const COACH_STEPS = UPGRADES.filter((u) => u.coachStep);

export const STAFF_NAMES = ['Kari', 'Jonas', 'Mette', 'Ali', 'Sigrid', 'Tore'];
