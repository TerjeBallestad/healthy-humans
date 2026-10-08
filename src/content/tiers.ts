export type TierId = 'alone' | 'work' | 'healthy';

export interface TierDef {
  id: TierId;
  label: string;
  /** Kroner added to the daily budget for the rest of the game. */
  taxPerWeek: number;
  /** Plain list of what the tier needs, for the UI. */
  needs: string;
}

/** Lowest tier first. */
export const TIERS: TierDef[] = [
  { id: 'alone', label: 'Fit to live alone', taxPerWeek: 10, needs: 'rungs 1 to 6 automatic' },
  {
    id: 'work',
    label: 'Fit for work',
    taxPerWeek: 30,
    needs: 'NAV meeting, job application, all routines automatic',
  },
  { id: 'healthy', label: 'Healthy human', taxPerWeek: 100, needs: 'work trial' },
];

export const TIER_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t])) as Record<
  TierId,
  TierDef
>;
