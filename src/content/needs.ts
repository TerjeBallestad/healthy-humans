export type NeedId = 'food' | 'hygiene' | 'energy' | 'home' | 'social';

export interface NeedDef {
  id: NeedId;
  label: string;
  /** Points lost per real second at 1x, at base rate. */
  decayPerSecond: number;
  /** Shown when the need is below the threshold. Behaviour, never a diagnosis. */
  lowState: string;
  /** Log line when the need drops low. {name} is the resident's name. */
  lowLog: string;
  /** Idle line when this is the worst need. */
  idleLine: string;
}

export const NEEDS: Record<NeedId, NeedDef> = {
  food: {
    id: 'food',
    label: 'Food',
    decayPerSecond: 5,
    lowState: 'skipping meals',
    lowLog: '{name} is skipping meals.',
    idleLine: 'Opens the fridge. Closes it again.',
  },
  hygiene: {
    id: 'hygiene',
    label: 'Hygiene',
    decayPerSecond: 3,
    lowState: "hasn't showered",
    lowLog: "{name} hasn't showered in days.",
    idleLine: 'Wearing the same hoodie as yesterday.',
  },
  energy: {
    id: 'energy',
    label: 'Energy',
    decayPerSecond: 6,
    lowState: 'exhausted',
    lowLog: '{name} is exhausted.',
    idleLine: 'Lying on the sofa, staring at the ceiling.',
  },
  home: {
    id: 'home',
    label: 'Home',
    decayPerSecond: 3,
    lowState: 'dishes piling up',
    lowLog: 'The dishes are piling up.',
    idleLine: 'Steps over a pile of clothes.',
  },
  social: {
    id: 'social',
    label: 'Social',
    decayPerSecond: 2.5,
    lowState: 'phone off',
    lowLog: '{name} turned the phone off.',
    idleLine: 'The phone lights up. Face down it goes.',
  },
};

export const NEED_ORDER: NeedId[] = ['food', 'hygiene', 'energy', 'home', 'social'];
