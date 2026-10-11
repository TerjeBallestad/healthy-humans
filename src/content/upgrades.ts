export type LineId = 'nudge' | 'omsorgRate' | 'omsorgCap' | 'staff' | 'grant' | 'house';

export type UpgradeTab = 'you' | 'staff' | 'funding' | 'house';

/** A named step in a line. */
export interface UpgradeStep {
  label: string;
  /** One dry line under the name. */
  note: string;
  /** Placeholder icon until there is art. */
  icon: string;
}

export interface LineDef {
  id: LineId;
  tab: UpgradeTab;
  /** Kroner for step 1. Each step after costs `UPGRADE_COST_GROWTH` times more. */
  baseCost: number;
  /** What each step does: multiply the value, or add to it. */
  grow: { times: number } | { plus: number };
  /** Steps the line has. No number means no end. */
  max?: number;
  /** Named steps in order. Past the last one, the names repeat with a number (see text.ts). */
  steps: UpgradeStep[];
}

/** Each step costs this many times the one before. */
export const UPGRADE_COST_GROWTH = 2.2;

// Ways to grow: make your own click stronger, build the machine that clicks for you, get more money,
// or make the house a better place to get well. Lines of rates have no end. The nudge line ends where a
// bigger nudge adds nothing.
export const LINES: LineDef[] = [
  {
    id: 'nudge',
    tab: 'you',
    baseCost: 500,
    grow: { plus: 1 },
    max: 3,
    steps: [
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
    baseCost: 600,
    grow: { times: 1.5 },
    steps: [
      { label: 'Lunch break', note: 'Thirty minutes. Nobody calls.', icon: '🥪' },
      { label: 'Avspasering', note: 'The overtime comes back as days off.', icon: '🏖️' },
    ],
  },
  {
    id: 'omsorgCap',
    tab: 'you',
    baseCost: 500,
    grow: { plus: 20 },
    steps: [
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
    baseCost: 600,
    grow: { times: 1.5 },
    steps: [
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
    baseCost: 800,
    grow: { times: 1.5 },
    steps: [
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
    baseCost: 700,
    grow: { times: 1.5 },
    steps: [
      { label: 'Common room', note: 'A sofa nobody owns, and a coffee machine.', icon: '🛋️' },
      { label: 'Garden', note: 'Six raised beds and a bench in the sun.', icon: '🌻' },
    ],
  },
];

export const LINE_BY_ID = Object.fromEntries(LINES.map((l) => [l.id, l])) as Record<
  LineId,
  LineDef
>;
