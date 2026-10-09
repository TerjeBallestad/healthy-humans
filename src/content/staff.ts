import type { NeedId } from './needs';

export type StaffRole = 'worker' | 'coach';

export interface RoleDef {
  id: StaffRole;
  label: string;
  icon: string;
  /** Kroner per week. */
  wage: number;
  /** What the role does, in one line on the profile. */
  does: string;
}

// Miljøarbeidere nudge bars. Coaches spend the residents' overskudd on training.
export const ROLES: Record<StaffRole, RoleDef> = {
  worker: {
    id: 'worker',
    label: 'Miljøarbeider',
    icon: '🤝',
    wage: 40,
    does: 'Nudges activity bars for free. Works on the specialities first, with a stronger nudge.',
  },
  coach: {
    id: 'coach',
    label: 'Coach',
    icon: '🧑‍🏫',
    wage: 60,
    does: "Spends the residents' overskudd to train their activities, up to the levels in the table.",
  },
};

/** What a miljøarbeider is good at: the activities that refill one need. */
export const SPECIALITY_LABEL: Record<NeedId, string> = {
  food: 'Cooking',
  hygiene: 'Hygiene',
  energy: 'Sleep',
  home: 'Housework',
  social: 'Social',
};

/** People who answer one job ad. */
export const CANDIDATES = 3;
/** Weeks from the job ad until the candidates show up. */
export const AD_WEEKS = 1;
/** Most staff the house can have. */
export const MAX_STAFF = 6;
/** A chance for each candidate to be a coach. */
export const COACH_SHARE = 0.35;
/** Segments a miljøarbeider's nudge fills on their speciality. */
export const SPECIALITY_FILL = 2;

/** Omsorg to teach a miljøarbeider one more speciality. */
export const SPECIALITY_TRAIN_COST = 30;
/** Omsorg to teach a coach the next level of an activity, by the level they know now. */
export const COACH_TRAIN_COST = [10, 20, 35] as const;

/** Placeholder faces until there are sprites. Each person rolls one. */
export const STAFF_FACES = ['🧑', '👩', '👨', '🧔', '👱', '👩‍🦱', '👨‍🦰', '👩‍🦳', '🧑‍🦱', '👨‍🦲'];

export const STAFF_NAMES = [
  'Kari',
  'Jonas',
  'Mette',
  'Ali',
  'Sigrid',
  'Tore',
  'Ingrid',
  'Emil',
  'Fatima',
  'Lars',
  'Nora',
  'Petter',
];
