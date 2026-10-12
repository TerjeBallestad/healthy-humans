// A patient's identity: one colour, or a pair with a primary and a secondary.
// The colours follow the MTG colour wheel, as in lifelines-core-loop. The player sees a chip
// with a keyword, not the colour names. See "Patient identity" in PLAN.md.

export type Colour = 'white' | 'blue' | 'black' | 'red' | 'green';

/** Wheel order. Pair names use it as the canonical order. */
export const COLOURS: Colour[] = ['white', 'blue', 'black', 'red', 'green'];

export interface Identity {
  primary: Colour;
  /** Missing for a single colour. */
  secondary?: Colour;
}

// TODO(Terje): placeholder keywords, taken from lifelines-core-loop's color_keywords.gd.
export const COLOUR_LABEL: Record<Colour, string> = {
  white: 'Caregiving',
  blue: 'Analytical',
  black: 'Self-care',
  red: 'Passionate',
  green: 'Grounding',
};

/** Pair names, keyed by the two colours in wheel order. */
// TODO(Terje): placeholder pair names, taken from color_keywords.gd.
export const PAIR_LABEL: Record<string, string> = {
  'white+blue': 'Methodical',
  'blue+black': 'Self-improvement',
  'black+red': 'Indulgent',
  'red+green': 'Instinctual',
  'white+green': 'Nurturing',
  'white+black': 'Protective',
  'blue+red': 'Creative',
  'black+green': 'Pragmatic',
  'white+red': 'Dutiful',
  'blue+green': 'Contemplative',
};

/** Our own palette for the chips, not the MTG colours. */
export const COLOUR_CSS: Record<Colour, string> = {
  white: '#e9d58f',
  blue: '#6f9bd1',
  black: '#8d7aa3',
  red: '#d9765f',
  green: '#7fb069',
};

/** How much the primary counts in a pair. The secondary counts the rest. A single colour counts fully. */
export const PRIMARY_WEIGHT = 0.6;
/** The first patients have one colour each, all different, so the player learns the colours one at a time. */
export const FIRST_SINGLES = 3;
/** After the first few, the share of new patients with one colour. */
export const SINGLE_SHARE = 0.2;

/** The two colours in wheel order, for the pair name. */
export function identityKey(id: Identity): string {
  if (!id.secondary) return id.primary;
  return [id.primary, id.secondary]
    .sort((a, b) => COLOURS.indexOf(a) - COLOURS.indexOf(b))
    .join('+');
}

export function identityLabel(id: Identity): string {
  return id.secondary ? PAIR_LABEL[identityKey(id)]! : COLOUR_LABEL[id.primary];
}
