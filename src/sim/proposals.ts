import {
  GOOD_FIT,
  HAND_SIZE,
  MILESTONES,
  MILESTONE_BY_ID,
  PHASES,
  PHASE_RULES,
  FIT_OVERSKUDD_BOOST,
  FIT_POOR_STRAIN,
  FIT_TAX_MULT,
  type FitLevel,
  type MilestoneId,
  type Phase,
} from '../content/milestones';
import { ACTIVITIES } from '../content/activities';
import { PRIMARY_WEIGHT, identityKey, type Identity } from '../content/identity';
import { CASEWORKER_SHARE_PER_LEVEL } from '../content/staff';
import {
  ATTEMPT_BONUS,
  MAX_SKILL,
  PROPOSAL_COOLDOWN_WEEKS,
  PROPOSAL_COST_MILESTONE,
  READY_SURE,
  PREP_CURVE,
  READY_UNSURE,
} from '../content/tuning';
import { random } from './rng';
import { identitiesShown } from './institution';
import { bestCaseWorker } from './staff';
import { unlockedActivities } from './selectors';
import { occupied, type GameState, type Resident } from './state';
import { log } from './tick';
import { TICKS_PER_WEEK } from './time';
import { LOG } from '../content/text';

// Proposals are milestones only. Skill comes from training with overskudd (actions.ts).
// A proposal offers a hand of cards from the patient's phase. The player picks one.
// Competence decides whether it works. The fit with the patient's identity decides what it means.

export function proposalCost(): number {
  return PROPOSAL_COST_MILESTONE;
}

/** The phase the patient is in: one success per phase moves them on. Null when all are done. */
export function phaseOf(r: Resident): Phase | null {
  return PHASES[r.milestones.length] ?? null;
}

/** True when the patient's phase is open: far enough up the ladder, and the routines done if needed. */
export function phaseOpen(r: Resident): boolean {
  const phase = phaseOf(r);
  if (!phase) return false;
  const rule = PHASE_RULES[phase];
  const routinesDone = unlockedActivities(r).every((a) => r.skill[a.id] >= MAX_SKILL);
  return r.unlockedRung >= rule.needsRung && (!rule.needsAllRoutines || routinesDone);
}

/** Hidden. How well a card fits an identity, from -3 to +3. */
export function fitOf(id: Identity, m: MilestoneId): number {
  const f = MILESTONE_BY_ID[m].fit;
  if (!id.secondary) return f[id.primary];
  return PRIMARY_WEIGHT * f[id.primary] + (1 - PRIMARY_WEIGHT) * f[id.secondary];
}

export function fitLevel(fit: number): FitLevel {
  return fit >= GOOD_FIT ? 'good' : fit <= -GOOD_FIT ? 'poor' : 'neutral';
}

/** Multiplies the tax at discharge: FIT_TAX_MULT when the purpose card that worked was a good fit. */
export function quality(r: Resident): number {
  const purpose = r.milestones.find((m) => MILESTONE_BY_ID[m].phase === 'purpose');
  return purpose && fitLevel(fitOf(r.identity, purpose)) === 'good' ? FIT_TAX_MULT : 1;
}

/** What a try did because of the fit, for the reaction screen. */
export type FitEffect =
  | { kind: 'overskudd'; boost: number }
  | { kind: 'tax'; mult: number }
  | { kind: 'strain'; strain: number };

/**
 * The fit acts at once. A good fit that works in identity or mastery makes overskudd grow faster for
 * the rest of the stay. A good purpose card that works raises the tax. A poor fit hurts, whatever the roll.
 */
export function applyFit(r: Resident, m: MilestoneId, won: boolean): FitEffect | undefined {
  const level = fitLevel(fitOf(r.identity, m));
  if (level === 'poor') {
    r.strain += FIT_POOR_STRAIN;
    return { kind: 'strain', strain: FIT_POOR_STRAIN };
  }
  if (level !== 'good' || !won) return undefined;
  if (MILESTONE_BY_ID[m].phase === 'purpose') return { kind: 'tax', mult: FIT_TAX_MULT };
  r.boost = (r.boost ?? 0) + FIT_OVERSKUDD_BOOST;
  return { kind: 'overskudd', boost: FIT_OVERSKUDD_BOOST };
}

/** The best fit, the worst fit and one other from the phase, in the order of the card list. */
export function dealHand(state: GameState, r: Resident, phase: Phase): MilestoneId[] {
  const cards = MILESTONES.filter((m) => m.phase === phase)
    .map((m) => m.id)
    .sort((a, b) => fitOf(r.identity, b) - fitOf(r.identity, a));
  if (cards.length <= HAND_SIZE) return cards;
  const middle = cards.slice(1, -1).sort(() => random(state) - 0.5);
  const hand = [cards[0]!, cards.at(-1)!, ...middle.slice(0, HAND_SIZE - 2)];
  const order = (id: MilestoneId) => MILESTONES.findIndex((m) => m.id === id);
  return hand.sort((a, b) => order(a) - order(b));
}

export function playbookKey(r: Resident, phase: Phase): string {
  return `${identityKey(r.identity)}:${phase}`;
}

/** The most kroner the slider goes to for this card. */
export function maxKr(m: MilestoneId): number {
  return PHASE_RULES[MILESTONE_BY_ID[m].phase].maxKr;
}

export function baseDifficulty(m: MilestoneId): number {
  return PHASE_RULES[MILESTONE_BY_ID[m].phase].difficulty;
}

/** The sum of the resident's skill levels, and a bonus for each earlier try at this card. */
export function competence(r: Resident, m: MilestoneId): number {
  const skills = ACTIVITIES.reduce((sum, a) => sum + r.skill[a.id], 0);
  return skills + ATTEMPT_BONUS * (r.attempts?.[m] ?? 0);
}

/** Preparation as a share of the full price, 0 to 1. */
export function prepShare(m: MilestoneId, kr: number): number {
  return Math.min(1, Math.max(0, kr / maxKr(m)));
}

/** A case worker of this level prepares the patient as well as this share of the full price. */
export function caseWorkerShare(level: number): number {
  return Math.min(1, CASEWORKER_SHARE_PER_LEVEL * level);
}

/** How much of the gap to certain a share of the full price closes. 0 gives 0, 1 gives 1. */
export function prepCurve(share: number): number {
  return (1 - Math.exp(-PREP_CURVE * share)) / (1 - Math.exp(-PREP_CURVE));
}

/** The share of the tug of war the resident wins. */
export function odds(c: number, d: number): number {
  return c + d > 0 ? c / (c + d) : 1;
}

export type Readiness = 'sure' | 'unsure' | 'doubt';

/** How sure the patient feels about the odds, for their answer. */
export function readiness(chance: number): Readiness {
  return chance >= READY_SURE ? 'sure' : chance >= READY_UNSURE ? 'unsure' : 'doubt';
}

/** The odds alone: competence against the card's difficulty. */
export function baseChance(r: Resident, m: MilestoneId): number {
  return odds(competence(r, m), baseDifficulty(m));
}

/** Preparation closes the gap from the odds alone to certain. The full price makes it sure. */
export function preparedChance(r: Resident, m: MilestoneId, share: number): number {
  const base = baseChance(r, m);
  return base + (1 - base) * prepCurve(share);
}

/** Odds for a wager in kroner. */
export function chance(r: Resident, m: MilestoneId, kr: number): number {
  return preparedChance(r, m, prepShare(m, kr));
}

/** Open a proposal for the first resident whose cooldown is over and who has the overskudd. */
export function maybePropose(state: GameState) {
  if (state.proposal || state.discharge) return;
  for (const [bed, r] of occupied(state)) {
    if (state.tick - r.lastProposalTick < PROPOSAL_COOLDOWN_WEEKS * TICKS_PER_WEEK) continue;
    const phase = phaseOf(r);
    if (!phase || !phaseOpen(r) || r.overskudd < proposalCost()) continue;
    const hand = dealHand(state, r, phase);
    const last = state.playbook[playbookKey(r, phase)];
    state.proposal = { bed, hand, overskuddBefore: r.overskudd };
    // The playbook is keyed by identity, so it prefills only once the player can see identities.
    if (identitiesShown(state) && last && hand.includes(last)) state.proposal.pick = last;
    // After the hire, the case worker supports every milestone. The player has no wager.
    const cw = bestCaseWorker(state);
    if (cw) state.proposal.caseWorker = cw.name;
    r.lastProposalTick = state.tick;
    state.resumeSpeed = state.speed || state.resumeSpeed;
    state.speed = 0;
    return;
  }
}

/** Choose a card from the hand. */
export function pick(state: GameState, m: MilestoneId): boolean {
  const p = state.proposal;
  if (!p || p.outcome || !p.hand.includes(m)) return false;
  p.pick = m;
  return true;
}

/** The preparation share the case worker in the proposal gives, or null before the first case worker. */
export function proposalCaseWorkerShare(state: GameState): number | null {
  const name = state.proposal?.caseWorker;
  const cw = name ? state.staff.find((x) => x.name === name) : undefined;
  return cw ? caseWorkerShare(cw.level ?? 1) : null;
}

/** The most the player can wager now: the budget in whole kroner, at most the top of the slider. */
export function maxWager(state: GameState): number {
  const p = state.proposal;
  return p?.pick ? Math.max(0, Math.min(maxKr(p.pick), Math.floor(state.budget))) : 0;
}

export function canWager(state: GameState, kr: number): boolean {
  return !!state.proposal && Number.isInteger(kr) && kr >= 0 && kr <= maxWager(state);
}

/** Go with the picked card. The player wagers kroner, or the case worker supports it. Rolls the outcome. */
export function accept(state: GameState, kr: number): boolean {
  const p = state.proposal;
  const r = p && state.beds[p.bed];
  if (!p || !r || !p.pick || p.outcome) return false;
  const cw = proposalCaseWorkerShare(state);
  if (cw !== null) {
    if (kr !== 0) return false;
    resolve(state, cw, 0);
    return true;
  }
  if (!canWager(state, kr)) return false;
  resolve(state, prepShare(p.pick, kr), kr);
  return true;
}

/** Pay the wager and the overskudd, and roll the outcome. A failed try adds competence for the next one. */
function resolve(state: GameState, share: number, kr: number) {
  const p = state.proposal!;
  const r = state.beds[p.bed]!;
  const id = p.pick!;
  const m = MILESTONE_BY_ID[id];
  const c = competence(r, id);
  const d = baseDifficulty(id);
  const chance = preparedChance(r, id, share);
  state.budget -= kr;
  // The overskudd is the price of doing it. Saying no costs nothing.
  r.overskudd -= proposalCost();
  state.playbook[playbookKey(r, m.phase)] = id;
  const roll = random(state);
  const won = roll < chance;
  Object.assign(p, { kr, chance, competence: c, difficulty: d, roll });
  p.outcome = won ? 'success' : 'failure';
  r.tries = [...(r.tries ?? []), { id, won }];
  p.effect = applyFit(r, id, won);
  state.milestoneTries = (state.milestoneTries ?? 0) + 1;
  if (won) r.milestones.push(id);
  else r.attempts = { ...r.attempts, [id]: (r.attempts?.[id] ?? 0) + 1 };
  p.result = won
    ? (m.success ?? LOG.milestoneDone(m.label))
    : (m.failure ?? LOG.milestoneFailed(m.label));
  log(state, p.result, r.name);
}

export function decline(state: GameState) {
  if (!state.proposal || state.proposal.outcome) return;
  state.proposal.outcome = 'declined';
}

/** Close the proposal and resume time. */
export function closeProposal(state: GameState) {
  if (!state.proposal?.outcome) return;
  state.proposal = null;
  state.speed = state.resumeSpeed;
}
