import type { NeedId } from './needs';

export type StaffRole = 'worker' | 'coach' | 'caseworker';

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
// Case workers take the residents' milestones in place of the player's wager.
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
  caseworker: {
    id: 'caseworker',
    // TODO(Terje): placeholder label and line for the case worker.
    label: 'Case worker',
    icon: '🗂️',
    wage: 60,
    does: 'Takes every milestone, and makes each one smaller for the resident.',
  },
};

/** The order of the roles on the job ad menu. */
export const ROLE_ORDER: StaffRole[] = ['worker', 'coach', 'caseworker'];

/** What a miljøarbeider is good at: the activities that refill one need. */
export const SPECIALITY_LABEL: Record<NeedId, string> = {
  food: 'Cooking',
  hygiene: 'Hygiene',
  energy: 'Sleep',
  home: 'Housework',
  social: 'Social',
};

/** Placeholder icons for the speciality courses. */
export const SPECIALITY_ICON: Record<NeedId, string> = {
  food: '🍳',
  hygiene: '🧼',
  energy: '🛌',
  home: '🧹',
  social: '💬',
};

/** People who answer one job ad. */
export const CANDIDATES = 3;
/** Weeks from the job ad until the candidates show up. */
export const AD_WEEKS = 1;
/** Office slots in the house. Any role can take a slot. */
export const MAX_STAFF = 4;
/** Segments a miljøarbeider's nudge fills on their speciality. */
export const SPECIALITY_FILL = 2;

/** Omsorg to teach a miljøarbeider one more speciality. */
export const SPECIALITY_TRAIN_COST = 30;
/** Omsorg for the mestring course. Any staff member can take it. */
export const MESTRING_TRAIN_COST = 40;
/** Overskudd each staff member with the mestring course adds for every resident. Added, not multiplied. */
export const MESTRING_BONUS = 0.25;

/** Omsorg to teach a coach the next level of an activity, by the level they know now. */
export const COACH_TRAIN_COST = [10, 20, 35] as const;

/** Support each case worker level gives. Support divides a milestone's difficulty: D ÷ (1 + support). */
export const CASEWORKER_SUPPORT_PER_LEVEL = 2;
export const CASEWORKER_MAX_LEVEL = 5;
/** A chance for a case worker candidate to start at lvl 2. The others start at lvl 1. */
export const CASEWORKER_LVL2_SHARE = 0.3;
/** Kroner for the casework course, by the level the case worker has now. */
export const CASEWORK_COST = [400, 750, 1400, 2600] as const;

/** Each course a staff member has (or came with) adds this to the wage, by role. */
export const WAGE_PER_LEVEL: Record<StaffRole, number> = { worker: 10, coach: 5, caseworker: 15 };
/** Coaching levels a coach has before the wage goes up. Every coach rolls at least this. */
export const COACH_BASE_LEVELS = 3;

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
