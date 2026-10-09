import type { ActivityId } from './activities';
import type { NeedId } from './needs';

export type TraitId = 'cooks' | 'tidy' | 'family' | 'rich';

// One trait for each referral, rolled when they join the list. Each one helps a different plan.
export interface TraitDef {
  id: TraitId;
  label: string;
  /** What it does, in a few words, for the waiting list. */
  effect: string;
  /** Skill levels the resident starts with. */
  startSkill?: Partial<Record<ActivityId, number>>;
  /** Multiplies the decay of these needs. */
  decay?: Partial<Record<NeedId, number>>;
  /** Multiplies overskudd growth. */
  overskudd?: number;
  /** Multiplies the tax paid after discharge. */
  tax?: number;
}

export const TRAITS: TraitDef[] = [
  {
    id: 'cooks',
    label: 'Cooks',
    effect: 'Eat and dishes at lvl 2',
    startSkill: { eat: 2, dishes: 2 },
  },
  { id: 'tidy', label: 'Tidy', effect: 'Home drops half as fast', decay: { home: 0.5 } },
  { id: 'family', label: 'Family visits', effect: 'Overskudd +50%', overskudd: 1.5 },
  { id: 'rich', label: 'Rich', effect: 'Double tax at discharge', tax: 2 },
];

export const TRAIT_BY_ID = Object.fromEntries(TRAITS.map((t) => [t.id, t])) as Record<
  TraitId,
  TraitDef
>;
