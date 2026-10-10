export type LineId = 'nudge' | 'staff' | 'grant' | 'house';

export type UpgradeId =
  | 'course'
  | 'supervision'
  | 'calendar'
  | 'handover'
  | 'report'
  | 'application'
  | 'commonRoom'
  | 'garden';

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
  /** Multiplies the kommune grant. The highest bought wins. */
  grantMult?: number;
  /** Multiplies overskudd for every resident. The highest bought wins. */
  overskuddMult?: number;
}

// Ways to grow: make your own click stronger, build the machine that clicks for you, get more money,
// or make the house a better place to get well.
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
    id: 'report',
    label: 'Annual report',
    note: 'Forty pages. The kommune reads the summary.',
    effect: 'Kommune grant ×1.5',
    icon: '📊',
    line: 'grant',
    cost: 800,
    grantMult: 1.5,
  },
  {
    id: 'application',
    label: 'Application to Helsedirektoratet',
    note: 'A pilot project with a logo.',
    effect: 'Kommune grant ×2',
    icon: '🏛️',
    line: 'grant',
    cost: 2000,
    after: 'report',
    grantMult: 2,
  },
  {
    id: 'commonRoom',
    label: 'Common room',
    note: 'A sofa nobody owns, and a coffee machine.',
    effect: 'Overskudd ×1.5 for everyone',
    icon: '🛋️',
    line: 'house',
    cost: 700,
    overskuddMult: 1.5,
  },
  {
    id: 'garden',
    label: 'Garden',
    note: 'Six raised beds and a bench in the sun.',
    effect: 'Overskudd ×2 for everyone',
    icon: '🌻',
    line: 'house',
    cost: 1800,
    after: 'commonRoom',
    overskuddMult: 2,
  },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u])) as Record<
  UpgradeId,
  UpgradeDef
>;

/** Lines in menu order, with the tab each one sits in. */
export const LINES: { id: LineId; tab: 'you' | 'staff' | 'funding' | 'house' }[] = [
  { id: 'nudge', tab: 'you' },
  { id: 'staff', tab: 'staff' },
  { id: 'grant', tab: 'funding' },
  { id: 'house', tab: 'house' },
];
