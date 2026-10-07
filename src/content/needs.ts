export type NeedId = 'food' | 'hygiene' | 'energy' | 'home' | 'social';

export interface NeedDef {
  id: NeedId;
  label: string;
  /** Points lost per game hour at base rate. */
  decayPerHour: number;
  /** Shown when the need is below the threshold. Behaviour, never a diagnosis. */
  lowState: string;
  /** Idle line when this is the worst need. */
  idleLine: string;
}

export const NEEDS: Record<NeedId, NeedDef> = {
  food: {
    id: 'food',
    label: 'Food',
    decayPerHour: 3.3,
    lowState: 'skipping meals',
    idleLine: 'Opens the fridge. Closes it again.',
  },
  hygiene: {
    id: 'hygiene',
    label: 'Hygiene',
    decayPerHour: 1.7,
    lowState: "hasn't showered",
    idleLine: 'Wearing the same hoodie as yesterday.',
  },
  energy: {
    id: 'energy',
    label: 'Energy',
    decayPerHour: 5,
    lowState: 'exhausted',
    idleLine: 'Lying on the sofa, staring at the ceiling.',
  },
  home: {
    id: 'home',
    label: 'Home',
    decayPerHour: 1.5,
    lowState: 'dishes piling up',
    idleLine: 'Steps over a pile of clothes.',
  },
  social: {
    id: 'social',
    label: 'Social',
    decayPerHour: 1,
    lowState: 'phone off',
    idleLine: 'The phone lights up. Face down it goes.',
  },
};

export const NEED_ORDER: NeedId[] = ['food', 'hygiene', 'energy', 'home', 'social'];
