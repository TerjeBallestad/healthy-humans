import { MILESTONES, MILESTONE_BY_ID } from '../content/milestones';
import { ACTIVITIES } from '../content/activities';
import { CASEWORKER_SUPPORT_PER_LEVEL } from '../content/staff';
import {
  ATTEMPT_BONUS,
  MAX_SKILL,
  PROPOSAL_COOLDOWN_WEEKS,
  PROPOSAL_COST_MILESTONE,
  WAGER_SUPPORT_AT_MAX,
} from '../content/tuning';
import { random } from './rng';
import { bestCaseWorker } from './staff';
import { unlockedActivities } from './selectors';
import { occupied, type GameState, type ProposalSubject, type Resident } from './state';
import { log } from './tick';
import { TICKS_PER_WEEK } from './time';

// Proposals are milestones only. Skill comes from training with overskudd (actions.ts).

export function proposalCost(_subject: ProposalSubject): number {
  return PROPOSAL_COST_MILESTONE;
}

/** The most kroner the slider goes to for this milestone. */
export function maxKr(subject: ProposalSubject): number {
  return MILESTONE_BY_ID[subject.milestone].maxKr;
}

/** The sum of the resident's skill levels, and a bonus for each earlier try at this milestone. */
export function competence(r: Resident, subject: ProposalSubject): number {
  const skills = ACTIVITIES.reduce((sum, a) => sum + r.skill[a.id], 0);
  return skills + ATTEMPT_BONUS * (r.attempts?.[subject.milestone] ?? 0);
}

/** Support divides the difficulty. Each point of support helps less than the one before. */
export function difficulty(subject: ProposalSubject, support: number): number {
  return MILESTONE_BY_ID[subject.milestone].difficulty / (1 + support);
}

/** Support from a wager: WAGER_SUPPORT_AT_MAX at the top of the slider. */
export function wagerSupport(subject: ProposalSubject, kr: number): number {
  return (WAGER_SUPPORT_AT_MAX * Math.min(kr, maxKr(subject))) / maxKr(subject);
}

/** Support from a case worker of this level. */
export function caseWorkerSupport(level: number): number {
  return CASEWORKER_SUPPORT_PER_LEVEL * level;
}

/** The share of the tug of war the resident wins. */
export function odds(c: number, d: number): number {
  return c + d > 0 ? c / (c + d) : 1;
}

/** Odds for a wager in kroner. */
export function chance(r: Resident, subject: ProposalSubject, kr: number): number {
  return odds(competence(r, subject), difficulty(subject, wagerSupport(subject, kr)));
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
    // After the hire, the case worker takes every milestone. The player has no wager.
    const cw = bestCaseWorker(state);
    if (cw) {
      state.proposal.caseWorker = cw.name;
      resolve(state, caseWorkerSupport(cw.level ?? 1), 0);
    }
    return;
  }
}

/** The most the player can wager now: the budget in whole kroner, at most the sure price. */
export function maxWager(state: GameState): number {
  const p = state.proposal;
  return p ? Math.max(0, Math.min(maxKr(p.subject), Math.floor(state.budget))) : 0;
}

export function canWager(state: GameState, kr: number): boolean {
  return !!state.proposal && Number.isInteger(kr) && kr >= 0 && kr <= maxWager(state);
}

/** Accept with a wager in kroner. Rolls the outcome. */
export function accept(state: GameState, kr: number): boolean {
  const p = state.proposal;
  const r = p && state.beds[p.bed];
  if (!p || !r || p.outcome || p.caseWorker || !canWager(state, kr)) return false;
  resolve(state, wagerSupport(p.subject, kr), kr);
  return true;
}

/** Pay the wager and the overskudd, and roll the outcome. A failed try adds competence for the next one. */
function resolve(state: GameState, support: number, kr: number) {
  const p = state.proposal!;
  const r = state.beds[p.bed]!;
  const c = competence(r, p.subject);
  const d = difficulty(p.subject, support);
  const chance = odds(c, d);
  state.budget -= kr;
  // The overskudd is the price of doing it. Saying no costs nothing.
  r.overskudd -= proposalCost(p.subject);
  const roll = random(state);
  const won = roll < chance;
  Object.assign(p, { kr, chance, competence: c, difficulty: d, roll });
  p.outcome = won ? 'success' : 'failure';
  const m = MILESTONE_BY_ID[p.subject.milestone];
  if (won) r.milestones.push(m.id);
  else r.attempts = { ...r.attempts, [m.id]: (r.attempts?.[m.id] ?? 0) + 1 };
  p.result = won ? m.success : m.failure;
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
