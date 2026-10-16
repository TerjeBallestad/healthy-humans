import type { Colour } from './identity';
import { byId } from './byId';

// Milestones are cards in three phases: identity, then mastery, then purpose.
// A proposal offers a hand of cards from the patient's phase. One success moves them to the next phase.
// Each card has a hidden fit for each colour, from -3 to +3. The player learns it from the reactions.

export type Phase = 'identity' | 'mastery' | 'purpose';
export const PHASES: Phase[] = ['identity', 'mastery', 'purpose'];

// TODO(Terje): placeholder phase names.
export const PHASE_LABEL: Record<Phase, string> = {
  identity: 'Identity',
  mastery: 'Mastery',
  purpose: 'Purpose',
};

/** The question the player answers when a proposal opens: what should the patient try in this phase? */
// TODO(Terje): placeholder questions. The identity one is from Terje's draft on 2026-10-16.
export const PHASE_QUESTION: Record<Phase, (name: string) => string> = {
  identity: (name) =>
    `${name} has been feeling a bit lost lately, and thinks a journey of self-discovery could help. What do you recommend, so ${name} can find out who they really are?`,
  mastery: (name) =>
    `${name} has found some footing and wants a real challenge. What should ${name} try to get good at?`,
  purpose: (name) => `${name} wants to give something back. Where could ${name} make a difference?`,
};

export type MilestoneId =
  | 'nav'
  | 'therapist'
  | 'retreat'
  | 'trip'
  | 'boat'
  | 'garden'
  | 'piano'
  | 'course'
  | 'job'
  | 'volunteer'
  | 'kidsTeam'
  | 'business';

export interface MilestoneDef {
  id: MilestoneId;
  phase: Phase;
  label: string;
  /** Where it happens, for the scene card. */
  placeIcon: string;
  place?: string;
  /** Lines for the scene card. A card without them shows only its label. */
  ask?: string;
  success?: string;
  failure?: string;
  /** Hidden. How well the card fits each colour, from -3 to +3. */
  fit: Record<Colour, number>;
  /** Purpose cards only: kroner per week after discharge as a healthy human, before the fit and the trait. */
  tax?: number;
}

/** Per phase: the difficulty against competence, the most kroner to wager, and the rung the patient needs. */
export const PHASE_RULES: Record<
  Phase,
  { difficulty: number; maxKr: number; needsRung: number; needsAllRoutines?: boolean }
> = {
  identity: { difficulty: 10, maxKr: 600, needsRung: 7 },
  mastery: { difficulty: 20, maxKr: 900, needsRung: 9 },
  purpose: { difficulty: 45, maxKr: 1400, needsRung: 9, needsAllRoutines: true },
};

const fit = (white: number, blue: number, black: number, red: number, green: number) => ({
  white,
  blue,
  black,
  red,
  green,
});

// TODO(Terje): card names are placeholders, from the grilling on 2026-10-12. Only NAV and the job
// keep the old lines. The others show their label until Terje writes them.
export const MILESTONES: MilestoneDef[] = [
  {
    id: 'nav',
    phase: 'identity',
    label: 'Meeting at NAV',
    placeIcon: '🏢',
    place: 'NAV office',
    ask: 'I want to go to the NAV meeting myself.',
    success: 'Went to NAV. Said what was needed. Came home with a plan.',
    failure: 'Sat in the waiting room. Left before the name was called.',
    fit: fit(3, 1, -1, -2, 0),
  },
  {
    id: 'therapist',
    phase: 'identity',
    label: 'Meeting a therapist',
    placeIcon: '🛋️',
    fit: fit(0, 3, 2, -1, -2),
  },
  {
    id: 'retreat',
    phase: 'identity',
    label: 'Meditation retreat',
    placeIcon: '🧘',
    fit: fit(1, -1, -2, -1, 3),
  },
  { id: 'trip', phase: 'identity', label: 'A trip', placeIcon: '🎒', fit: fit(-2, 0, 1, 3, 1) },
  {
    id: 'boat',
    phase: 'mastery',
    label: 'Build a boat',
    placeIcon: '⛵',
    fit: fit(-1, 2, 2, 1, 1),
  },
  {
    id: 'garden',
    phase: 'mastery',
    label: 'Fix the garden',
    placeIcon: '🌱',
    fit: fit(1, -1, -2, 0, 3),
  },
  {
    id: 'piano',
    phase: 'mastery',
    label: 'Learn the piano',
    placeIcon: '🎹',
    fit: fit(0, 1, 0, 3, -1),
  },
  { id: 'course', phase: 'mastery', label: 'A course', placeIcon: '📚', fit: fit(3, 2, 1, -2, -1) },
  {
    id: 'job',
    phase: 'purpose',
    label: 'A job',
    placeIcon: '🏭',
    place: 'Warehouse',
    ask: 'They want me for a trial week.',
    success: 'Five days at the warehouse. Came home tired. The good kind.',
    failure: 'Called in sick on Wednesday.',
    fit: fit(2, 2, 0, -2, 0),
    tax: 100,
  },
  {
    id: 'volunteer',
    phase: 'purpose',
    label: 'Volunteering',
    placeIcon: '🤲',
    fit: fit(3, 0, -3, 0, 1),
    tax: 20,
  },
  {
    id: 'kidsTeam',
    phase: 'purpose',
    label: "Coaching a kids' team",
    placeIcon: '⚽',
    fit: fit(1, -1, -1, 1, 3),
    tax: 30,
  },
  {
    id: 'business',
    phase: 'purpose',
    label: 'A small business',
    placeIcon: '🧾',
    fit: fit(-2, 1, 3, 2, -1),
    tax: 60,
  },
];

export const MILESTONE_BY_ID = byId(MILESTONES);

/** Cards in a hand. */
export const HAND_SIZE = 3;
/** Fit at or above this is good, at or below its negative is poor. */
export const GOOD_FIT = 1;
/** A good fit that works in identity or mastery: overskudd grows this much faster for the rest of the stay. */
export const FIT_OVERSKUDD_BOOST = 0.25;
/** A good purpose card that works multiplies the tax at discharge by this. */
export const FIT_TAX_MULT = 1.5;
/** A poor fit, whatever the roll, adds this strain: needs drop faster for a while, as after a long wait. */
export const FIT_POOR_STRAIN = 0.2;

export type FitLevel = 'good' | 'neutral' | 'poor';

/** The patient's face after a milestone, by result and fit. Placeholders until there are lines. */
export const REACTION_FACE: Record<'success' | 'failure', Record<FitLevel, string>> = {
  success: { good: '🤩', neutral: '🙂', poor: '😶' },
  failure: { good: '😤', neutral: '😕', poor: '😞' },
};

/**
 * What the patient says afterwards, in two parts. The fit line says how it felt. The result line
 * says whether it worked, and is keyed by the fit too, so it can agree or contrast ("But ...").
 */
// TODO(Terje): placeholder reaction lines, from Terje's examples on 2026-10-16.
export const REACTION_FIT_LINE: Record<FitLevel, string> = {
  good: 'I had a great experience.',
  neutral: 'Not my cup of tea.',
  poor: 'I really hated it.',
};

export const REACTION_RESULT_LINE: Record<'success' | 'failure', Record<FitLevel, string>> = {
  success: {
    good: 'I feel like a new person.',
    neutral: 'But I learned a thing or two.',
    poor: 'But I learned a thing or two about myself.',
  },
  failure: {
    good: "But I don't feel like I learned anything.",
    neutral: "I don't feel like I learned anything.",
    poor: "And I don't feel like I learned anything.",
  },
};
