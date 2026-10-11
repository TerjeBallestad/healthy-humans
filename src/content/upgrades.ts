export type LineId = 'nudge' | 'omsorgRate' | 'omsorgCap' | 'staff' | 'grant' | 'house';

export type UpgradeTab = 'you' | 'staff' | 'funding' | 'house';

/** A named level with a big bonus. One comes every `MILESTONE_EVERY` levels. */
export interface UpgradeMilestone {
  label: string;
  /** One dry line under the name. */
  note: string;
  /** Placeholder icon until there is art. */
  icon: string;
}

export interface LineDef {
  id: LineId;
  tab: UpgradeTab;
  /** Kroner for level 1. Each level after costs `UPGRADE_COST_GROWTH` times more. */
  baseCost: number;
  /** Named milestones in order. Past the last one, the names repeat with a number (see text.ts). */
  milestones: UpgradeMilestone[];
}

/** Levels between named milestones. */
export const MILESTONE_EVERY = 10;
/** Each plain level adds this much to the line's multiplier. */
export const UPGRADE_STEP = 0.1;
/** Each named milestone multiplies the line by this. */
export const MILESTONE_BONUS = 2;
/** Each level costs this many times the one before. */
export const UPGRADE_COST_GROWTH = 1.15;

// Ways to grow: make your own click stronger, build the machine that clicks for you, get more money,
// or make the house a better place to get well. Every line has levels with no end, as in AdVenture Capitalist.
export const LINES: LineDef[] = [
  {
    id: 'nudge',
    tab: 'you',
    baseCost: 75,
    milestones: [
      {
        label: 'Course in motivational interviewing',
        note: 'Two days at a hotel in Lillestrøm.',
        icon: '🏨',
      },
      { label: 'Supervision group', note: 'Every second Thursday. There are buns.', icon: '🫂' },
    ],
  },
  {
    id: 'omsorgRate',
    tab: 'you',
    baseCost: 90,
    milestones: [
      { label: 'Lunch break', note: 'Thirty minutes. Nobody calls.', icon: '🥪' },
      { label: 'Avspasering', note: 'The overtime comes back as days off.', icon: '🏖️' },
    ],
  },
  {
    id: 'omsorgCap',
    tab: 'you',
    baseCost: 75,
    milestones: [
      { label: 'Own office', note: 'A door that closes.', icon: '🚪' },
      {
        label: 'Electronic journal',
        note: 'The notes are in one place, not on napkins.',
        icon: '💻',
      },
    ],
  },
  {
    id: 'staff',
    tab: 'staff',
    baseCost: 90,
    milestones: [
      { label: 'Shared calendar', note: 'Nobody books the same room twice.', icon: '📅' },
      {
        label: 'Handover routine',
        note: 'Ten minutes at every shift change. Written down.',
        icon: '📋',
      },
    ],
  },
  {
    id: 'grant',
    tab: 'funding',
    baseCost: 120,
    milestones: [
      { label: 'Annual report', note: 'Forty pages. The kommune reads the summary.', icon: '📊' },
      {
        label: 'Application to Helsedirektoratet',
        note: 'A pilot project with a logo.',
        icon: '🏛️',
      },
    ],
  },
  {
    id: 'house',
    tab: 'house',
    baseCost: 105,
    milestones: [
      { label: 'Common room', note: 'A sofa nobody owns, and a coffee machine.', icon: '🛋️' },
      { label: 'Garden', note: 'Six raised beds and a bench in the sun.', icon: '🌻' },
    ],
  },
];

export const LINE_BY_ID = Object.fromEntries(LINES.map((l) => [l.id, l])) as Record<
  LineId,
  LineDef
>;
