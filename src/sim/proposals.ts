import { MILESTONES, MILESTONE_BY_ID } from '../content/milestones';
import {
  MAX_CHANCE,
  MAX_SKILL,
  PROPOSAL_COOLDOWN_WEEKS,
  PROPOSAL_COST_MILESTONE,
  SUPPORT_STEPS,
} from '../content/tuning';
import { random } from './rng';
import { unlockedActivities } from './selectors';
import type { GameState, ProposalSubject, Resident } from './state';
import { log } from './tick';
import { TICKS_PER_WEEK } from './time';

// Proposals are milestones only. Skill comes from training with overskudd (actions.ts).

export function proposalCost(_subject: ProposalSubject): number {
  return PROPOSAL_COST_MILESTONE;
}

export function chance(_r: Resident, subject: ProposalSubject, step: number): number {
  const base = MILESTONE_BY_ID[subject.milestone].baseChance;
  return Math.min(MAX_CHANCE, base + (SUPPORT_STEPS[step]?.bonus ?? 0));
}

export function oddsWord(p: number): string {
  if (p < 0.4) return 'a stretch';
  if (p < 0.7) return 'maybe';
  return 'likely';
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

/** Open a proposal when the cooldown is over and the resident has the overskudd. */
export function maybePropose(state: GameState) {
  if (state.proposal || state.discharge) return;
  if (state.tick - state.lastProposalTick < PROPOSAL_COOLDOWN_WEEKS * TICKS_PER_WEEK) return;
  const r = state.resident;
  const subject = eligibleSubjects(r)[0];
  if (!subject || r.overskudd < proposalCost(subject)) return;
  state.proposal = { subject };
  state.lastProposalTick = state.tick;
  state.resumeSpeed = state.speed || state.resumeSpeed;
  state.speed = 0;
}

export function canSupport(state: GameState, step: number): boolean {
  return state.budget >= (SUPPORT_STEPS[step]?.kr ?? Infinity);
}

/** What the player gets if it works, in one line. */
export function rewardText(r: Resident, subject: ProposalSubject): string {
  const m = MILESTONE_BY_ID[subject.milestone];
  return `${m.label} done. Needed before ${r.name} can be discharged as "${m.forTier}".`;
}

/** Accept with a support step. Rolls the outcome. */
export function accept(state: GameState, step: number): boolean {
  const p = state.proposal;
  if (!p || p.outcome || !canSupport(state, step)) return false;
  const r = state.resident;
  const odds = chance(r, p.subject, step);
  state.budget -= SUPPORT_STEPS[step]!.kr;
  const reward = rewardText(r, p.subject);
  r.overskudd -= proposalCost(p.subject);
  const won = random(state) < odds;
  p.outcome = won ? 'success' : 'failure';
  const m = MILESTONE_BY_ID[p.subject.milestone];
  if (won) {
    r.milestones.push(m.id);
    p.gain = reward;
  }
  p.result = won ? m.success : m.failure;
  log(state, p.result);
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
