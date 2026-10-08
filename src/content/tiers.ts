export type TierId = 'alone' | 'work' | 'healthy';

export interface TierDef {
  id: TierId;
  label: string;
  /** Kroner added to the daily budget for the rest of the game. */
  taxPerWeek: number;
}

/** Lowest tier first. */
export const TIERS: TierDef[] = [
  { id: 'alone', label: 'Fit to live alone', taxPerWeek: 10 },
  {
    id: 'work',
    label: 'Fit for work',
    taxPerWeek: 30,
  },
  { id: 'healthy', label: 'Healthy human', taxPerWeek: 100 },
];

export const TIER_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t])) as Record<
  TierId,
  TierDef
>;
