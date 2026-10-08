import type { NeedId } from './needs';
import type { TierId } from './tiers';

export type ArchetypeId = 'arvid' | 'maja';

/** Personality colours, as in lifelines-core-loop's character_profile.gd. Unused for now. */
export type Colour = 'white' | 'blue' | 'black' | 'red' | 'green';

// Grey-box residents. Keep them loose: the plan is a procedural personality system later.
export interface ArchetypeDef {
  id: ArchetypeId;
  name: string;
  intro: string;
  /** Log line when the resident moves in. */
  arrives: string;
  startNeeds: Record<NeedId, number>;
  /** Multiplies each need's base decay rate. Missing means 1. */
  decay: Partial<Record<NeedId, number>>;
  /** Two lines about life after discharge, for each tier. */
  glimpse: Record<TierId, [string, string]>;
  colours?: Partial<Record<Colour, number>>;
}

export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: 'arvid',
    name: 'Arvid',
    intro: '41. Has not left his flat in a year. The curtains stay closed.',
    arrives: 'Arvid moves in. He brought one bag.',
    startNeeds: { food: 70, hygiene: 55, energy: 80, home: 60, social: 50 },
    decay: {},
    glimpse: {
      alone: [
        'Arvid lives in a one-room flat in Grünerløkka.',
        'The curtains are open most days. Nobody calls much.',
      ],
      work: [
        'Arvid stacks pallets at the warehouse on weekdays.',
        'On Fridays he buys a pastry on the way home.',
      ],
      healthy: [
        'Arvid has a permanent contract and a second-hand bike.',
        'His sister came for dinner. He cooked.',
      ],
    },
    colours: { blue: 0.6, white: 0.3 },
  },
  {
    id: 'maja',
    name: 'Maja',
    intro: '23. Sleeps until three. Dropped out of school in the spring.',
    arrives: 'Maja moves in. Her mother carries the boxes.',
    startNeeds: { food: 60, hygiene: 70, energy: 40, home: 50, social: 65 },
    decay: { energy: 1.3, food: 0.8, social: 1.2 },
    glimpse: {
      alone: ['Maja shares a flat with two students.', 'She is up before noon. Most days.'],
      work: [
        'Maja works mornings at a café by the station.',
        'She learned to make the foam leaf on the second week.',
      ],
      healthy: [
        'Maja went back to school and works weekends.',
        'Her mother calls. Maja calls back.',
      ],
    },
    colours: { red: 0.5, green: 0.4 },
  },
];

export const ARCHETYPE_BY_ID = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a])) as Record<
  ArchetypeId,
  ArchetypeDef
>;
