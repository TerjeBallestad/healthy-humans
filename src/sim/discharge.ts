import { ACTIVITIES } from '../content/activities';
import { ARCHETYPES } from '../content/archetypes';
import { TIERS, TIER_BY_ID, type TierDef, type TierId } from '../content/tiers';
import { MAX_SKILL } from '../content/tuning';
import { newResident, type GameState, type Resident } from './state';
import { log } from './tick';

const automatic = (r: Resident, upToRung: number) =>
  ACTIVITIES.filter((a) => a.rung <= upToRung).every((a) => r.skill[a.id] >= MAX_SKILL);

export function tierOpen(r: Resident, id: TierId): boolean {
  switch (id) {
    case 'alone':
      return automatic(r, 6);
    case 'work':
      return (
        r.milestones.includes('nav') &&
        r.milestones.includes('application') &&
        automatic(r, ACTIVITIES.length)
      );
    case 'healthy':
      return r.milestones.includes('worktrial');
  }
}

/** The best tier the resident can be discharged at now, if any. */
export function bestTier(r: Resident): TierDef | null {
  return [...TIERS].reverse().find((t) => tierOpen(r, t.id)) ?? null;
}

/** The next tier up, for showing what waiting could give. */
export function nextTier(r: Resident): TierDef | null {
  const best = bestTier(r);
  const i = best ? TIERS.indexOf(best) + 1 : 0;
  return TIERS[i] ?? null;
}

export function taxPerDay(s: GameState): number {
  return s.discharged.reduce((sum, d) => sum + TIER_BY_ID[d.tier].taxPerDay, 0);
}

/** Open the vedtak for the best tier. Pauses the game. */
export function openDischarge(s: GameState): boolean {
  const tier = bestTier(s.resident);
  if (!tier || s.discharge || s.proposal) return false;
  s.discharge = { tier: tier.id, signed: false };
  s.resumeSpeed = s.speed || s.resumeSpeed;
  s.speed = 0;
  return true;
}

export function cancelDischarge(s: GameState) {
  if (!s.discharge || s.discharge.signed) return;
  s.discharge = null;
  s.speed = s.resumeSpeed;
}

/** Sign the vedtak. The resident leaves and starts paying tax. */
export function signDischarge(s: GameState): boolean {
  const d = s.discharge;
  if (!d || d.signed) return false;
  const r = s.resident;
  s.discharged.push({ name: r.name, tier: d.tier, minute: s.minute });
  d.signed = true;
  log(s, `${r.name} is discharged: ${TIER_BY_ID[d.tier].label.toLowerCase()}.`);
  return true;
}

/** The archetype after the current resident. Cycles through the list. */
export function nextArchetype(s: GameState) {
  const i = ARCHETYPES.findIndex((a) => a.id === s.resident.archetype);
  return ARCHETYPES[(i + 1) % ARCHETYPES.length]!;
}

/** Close the dialog and move the next resident into the empty bed. */
export function admitNext(s: GameState) {
  if (!s.discharge?.signed) return;
  const a = nextArchetype(s);
  s.resident = newResident(a.id);
  s.discharge = null;
  s.lastProposalMinute = s.minute;
  log(s, a.arrives);
  s.speed = s.resumeSpeed;
}
