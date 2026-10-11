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
    does: 'Takes every milestone. The odds are the skill minus the difficulty of the milestone.',
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

/** Skill a case worker candidate rolls, from 0 to 100. */
export const CASEWORKER_SKILL_MIN = 40;
export const CASEWORKER_SKILL_MAX = 60;
/** Skill one casework course adds. */
export const CASEWORK_STEP = 5;
/** Kroner for the casework course at skill 50. Each step up costs CASEWORK_COST_GROWTH times more. */
export const CASEWORK_COST_AT_50 = 400;
export const CASEWORK_COST_GROWTH = 1.35;

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
