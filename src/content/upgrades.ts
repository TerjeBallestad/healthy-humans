export type LineId = 'nudge' | 'staff' | 'coach';

export type UpgradeId =
  'course' | 'supervision' | 'calendar' | 'handover' | 'coach1' | 'coach2' | 'coach3';

export interface UpgradeDef {
  id: UpgradeId;
  label: string;
  /** One dry line under the name. */
  note: string;
  /** What it does, in a few words. */
  effect: string;
  /** Placeholder icon until there is art. */
  icon: string;
  /** Upgrades in one line share a card in the menu and are bought in order. */
  line: LineId;
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
    effect: 'Each nudge fills 2 segments',
    icon: '🏨',
    line: 'nudge',
    cost: 500,
    nudgeMult: 2,
  },
  {
    id: 'supervision',
    label: 'Supervision group',
    note: 'Every second Thursday. There are buns.',
    effect: 'Each nudge fills 3 segments',
    icon: '🫂',
    line: 'nudge',
    cost: 1500,
    after: 'course',
    nudgeMult: 3,
  },
  {
    id: 'calendar',
    label: 'Shared calendar',
    note: 'Nobody books the same room twice.',
    effect: 'Staff nudge 50% more often',
    icon: '📅',
    line: 'staff',
    cost: 600,
    staffMult: 1.5,
  },
  {
    id: 'handover',
    label: 'Handover routine',
    note: 'Ten minutes at every shift change. Written down.',
    effect: 'Staff nudge twice as often',
    icon: '📋',
    line: 'staff',
    cost: 1600,
    after: 'calendar',
    staffMult: 2,
  },
  {
    id: 'coach1',
    label: 'Coach',
    note: 'Someone who knows how to start small.',
    effect: 'The coach trains lvl 1 for 8 overskudd',
    icon: '🧑‍🏫',
    line: 'coach',
    cost: 400,
    coachStep: 1,
  },
  {
    id: 'coach2',
    label: 'Experienced coach',
    note: '',
    effect: 'The coach also trains lvl 2 for 15 overskudd',
    icon: '🧑‍🏫',
    line: 'coach',
    cost: 900,
    after: 'coach1',
    coachStep: 2,
  },
  {
    id: 'coach3',
    label: 'Senior coach',
    note: '',
    effect: 'The coach also trains the last level for 25 overskudd',
    icon: '🧑‍🏫',
    line: 'coach',
    cost: 1400,
    after: 'coach2',
    coachStep: 3,
  },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u])) as Record<
  UpgradeId,
  UpgradeDef
>;

/** Lines in menu order, with the tab each one sits in. */
export const LINES: { id: LineId; tab: 'you' | 'staff' }[] = [
  { id: 'nudge', tab: 'you' },
  { id: 'staff', tab: 'staff' },
  { id: 'coach', tab: 'staff' },
];

export const STAFF_NAMES = ['Kari', 'Jonas', 'Mette', 'Ali', 'Sigrid', 'Tore'];
