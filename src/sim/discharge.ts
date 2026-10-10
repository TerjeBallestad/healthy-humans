import { ACTIVITIES } from '../content/activities';
import { MILESTONE_BY_ID } from '../content/milestones';
import { TIERS, TIER_BY_ID, type TierDef, type TierId } from '../content/tiers';
import { TRAIT_BY_ID } from '../content/traits';
import {
  MAX_SKILL,
  WAIT_NEED_FLOOR,
  WAIT_NEED_LOSS_PER_HEALTH,
  WAIT_STRAIN_PER_HEALTH,
} from '../content/tuning';
import type { GameState, Resident } from './state';
import { log } from './tick';
import { LOG } from '../content/text';

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

/** The parts of a tier the resident has not done yet, for the UI. */
export function tierMissing(r: Resident, id: TierId): string[] {
  const milestone = (m: 'nav' | 'application' | 'worktrial') =>
    r.milestones.includes(m) ? [] : [MILESTONE_BY_ID[m].label];
  switch (id) {
    case 'alone':
      return automatic(r, 6) ? [] : ['rungs 1 to 6 automatic'];
    case 'work':
      return [
        ...milestone('nav'),
        ...milestone('application'),
        ...(automatic(r, ACTIVITIES.length) ? [] : ['all routines automatic']),
      ];
    case 'healthy':
      return milestone('worktrial');
  }
}

/** Kroner per week this resident pays after discharge at a tier. */
export function tierTax(r: Resident, id: TierId): number {
  return TIER_BY_ID[id].taxPerWeek * ((r.trait && TRAIT_BY_ID[r.trait].tax) ?? 1);
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

export function taxPerWeek(s: GameState): number {
  return s.discharged.reduce((sum, d) => sum + d.tax, 0);
}

/** Open the vedtak for the resident in a bed, at their best tier. Pauses the game. */
export function openDischarge(s: GameState, bed: number): boolean {
  const r = s.beds[bed];
  const tier = r && bestTier(r);
  if (!tier || s.discharge || s.proposal) return false;
  s.discharge = { bed, tier: tier.id, signed: false };
  s.resumeSpeed = s.speed || s.resumeSpeed;
  s.speed = 0;
  return true;
}

export function cancelDischarge(s: GameState) {
  if (!s.discharge || s.discharge.signed) return;
  s.discharge = null;
  s.speed = s.resumeSpeed;
}

/** Sign the vedtak. The resident starts paying tax. The dialog shows a glimpse next. */
export function signDischarge(s: GameState): boolean {
  const d = s.discharge;
  const r = d && s.beds[d.bed];
  if (!d || d.signed || !r) return false;
  s.discharged.push({ name: r.name, tier: d.tier, tax: tierTax(r, d.tier), tick: s.tick });
  d.signed = true;
  log(s, LOG.discharged(TIER_BY_ID[d.tier].label), r.name);
  return true;
}

/** Close the glimpse. The resident leaves and the bed stands empty. */
export function closeDischarge(s: GameState) {
  const d = s.discharge;
  if (!d?.signed) return;
  s.beds[d.bed] = null;
  s.discharge = null;
  s.speed = s.resumeSpeed;
}

/** What poor health costs a person at admission, for the vedtak. */
export function waitCost(health: number) {
  const missing = 100 - Math.max(0, health);
  return {
    needLoss: Math.round(Math.min(100 - WAIT_NEED_FLOOR, missing * WAIT_NEED_LOSS_PER_HEALTH)),
    strainPct: Math.round(missing * WAIT_STRAIN_PER_HEALTH * 100),
  };
}
