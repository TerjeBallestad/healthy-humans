export type UpgradeId =
  'course' | 'supervision' | 'calendar' | 'handover' | 'coach1' | 'coach2' | 'coach3';

export interface UpgradeDef {
  id: UpgradeId;
  label: string;
  /** One dry line under the name. */
  note: string;
  /** What it does, in a few words. */
  effect: string;
  /** What it is and what it does, for the requests menu. */
  description: string;
  /** Your own work, or the staff's. */
  pane: 'you' | 'staff';
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
    description:
      'A two-day course in how to talk with people so that they want to change. Each nudge you give fills 2 segments. The staff do not take the course.',
    pane: 'you',
    cost: 500,
    nudgeMult: 2,
  },
  {
    id: 'supervision',
    label: 'Supervision group',
    note: 'Every second Thursday. There are buns.',
    effect: 'Your nudges fill 3 segments',
    description:
      'You talk through hard cases with other people who do the same work. Each nudge you give fills 3 segments.',
    pane: 'you',
    cost: 1500,
    after: 'course',
    nudgeMult: 3,
  },
  {
    id: 'calendar',
    label: 'Shared calendar',
    note: 'Nobody books the same room twice.',
    effect: 'Staff work 50% faster',
    description:
      'The staff stop booking the same room and waiting for each other. Each staff member nudges 50% more often.',
    pane: 'staff',
    cost: 600,
    staffMult: 1.5,
  },
  {
    id: 'handover',
    label: 'Handover routine',
    note: 'Ten minutes at every shift change. Written down.',
    effect: 'Staff work twice as fast',
    description:
      'Each shift starts where the last one stopped. Each staff member nudges twice as often as with no routine.',
    pane: 'staff',
    cost: 1600,
    after: 'calendar',
    staffMult: 2,
  },
  {
    id: 'coach1',
    label: 'Coach: lvl 1',
    note: 'Someone who knows how to start small.',
    effect: 'Spends overskudd on lvl 1',
    description:
      "A coach who helps residents take the first step. The coach spends the resident's overskudd to train activities from lvl 0 to lvl 1, at 8 overskudd each. While a milestone is open, the coach keeps 20 overskudd for the proposal. You cannot undo this.",
    pane: 'staff',
    cost: 400,
    coachStep: 1,
  },
  {
    id: 'coach2',
    label: 'Coach: lvl 2',
    note: '',
    effect: 'Spends overskudd on lvl 2',
    description:
      'The coach also trains activities from lvl 1 to lvl 2, at 15 overskudd each. The coach spends on the cheapest level first, so overskudd goes here before the last level. You cannot undo this.',
    pane: 'staff',
    cost: 900,
    after: 'coach1',
    coachStep: 2,
  },
  {
    id: 'coach3',
    label: 'Coach: independent',
    note: '',
    effect: 'Spends overskudd on the last level',
    description:
      'The coach also trains the last level, at 25 overskudd each. The activity becomes independent. You cannot undo this.',
    pane: 'staff',
    cost: 1400,
    after: 'coach2',
    coachStep: 3,
  },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u])) as Record<
  UpgradeId,
  UpgradeDef
>;

export const STAFF_NAMES = ['Kari', 'Jonas', 'Mette', 'Ali', 'Sigrid', 'Tore'];
