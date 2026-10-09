import { MILESTONES, MILESTONE_BY_ID } from '../content/milestones';
import {
  MAX_CHANCE,
  MAX_SKILL,
  PROPOSAL_COOLDOWN_WEEKS,
  PROPOSAL_COST_MILESTONE,
} from '../content/tuning';
import { random } from './rng';
import { unlockedActivities } from './selectors';
import { occupied, type GameState, type ProposalSubject, type Resident } from './state';
import { log } from './tick';
import { TICKS_PER_WEEK } from './time';

// Proposals are milestones only. Skill comes from training with overskudd (actions.ts).

export function proposalCost(_subject: ProposalSubject): number {
  return PROPOSAL_COST_MILESTONE;
}

/** Kroner that make the proposal sure to work. */
export function surePrice(subject: ProposalSubject): number {
  return MILESTONE_BY_ID[subject.milestone].sure;
}

/**
 * Odds for a wager. Each krone adds less than the one before, up to MAX_CHANCE.
 * The sure price makes it certain.
 */
export function chance(_r: Resident, subject: ProposalSubject, kr: number): number {
  const m = MILESTONE_BY_ID[subject.milestone];
  if (kr >= m.sure) return 1;
  return m.baseChance + (MAX_CHANCE - m.baseChance) * (1 - Math.exp((-3 * kr) / m.sure));
}

export function askText(subject: ProposalSubject): string {
  return MILESTONE_BY_ID[subject.milestone].ask;
}

/** Every milestone the resident could propose right now, in order. */
export function eligibleSubjects(r: Resident): ProposalSubject[] {
  const routinesDone = unlockedActivities(r).every((a) => r.skill[a.id] >= MAX_SKILL);
  return MILESTONES.filter(
    (m) =>
      !r.milestones.includes(m.id) &&
      r.unlockedRung >= m.needsRung &&
      (!m.after || r.milestones.includes(m.after)) &&
      (!m.needsAllRoutines || routinesDone),
  ).map((m) => ({ kind: 'milestone', milestone: m.id }));
}

/** Open a proposal for the first resident whose cooldown is over and who has the overskudd. */
export function maybePropose(state: GameState) {
  if (state.proposal || state.discharge) return;
  for (const [bed, r] of occupied(state)) {
    if (state.tick - r.lastProposalTick < PROPOSAL_COOLDOWN_WEEKS * TICKS_PER_WEEK) continue;
    const subject = eligibleSubjects(r)[0];
    if (!subject || r.overskudd < proposalCost(subject)) continue;
    state.proposal = { bed, subject, overskuddBefore: r.overskudd };
    r.lastProposalTick = state.tick;
    state.resumeSpeed = state.speed || state.resumeSpeed;
    state.speed = 0;
    return;
  }
}

/** The most the player can wager now: the budget in whole kroner, at most the sure price. */
export function maxWager(state: GameState): number {
  const p = state.proposal;
  return p ? Math.max(0, Math.min(surePrice(p.subject), Math.floor(state.budget))) : 0;
}

export function canWager(state: GameState, kr: number): boolean {
  return !!state.proposal && Number.isInteger(kr) && kr >= 0 && kr <= maxWager(state);
}

/** Accept with a wager in kroner. Rolls the outcome. */
export function accept(state: GameState, kr: number): boolean {
  const p = state.proposal;
  const r = p && state.beds[p.bed];
  if (!p || !r || p.outcome || !canWager(state, kr)) return false;
  const odds = chance(r, p.subject, kr);
  state.budget -= kr;
  // The overskudd is the price of doing it. Saying no costs nothing.
  r.overskudd -= proposalCost(p.subject);
  const roll = random(state);
  const won = roll < odds;
  Object.assign(p, { kr, chance: odds, roll, outcome: won ? 'success' : 'failure' });
  const m = MILESTONE_BY_ID[p.subject.milestone];
  if (won) r.milestones.push(m.id);
  p.result = won ? m.success : m.failure;
  log(state, p.result, r.name);
  return true;
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
