import { ACTIVITY_BY_ID } from '../content/activities';
import { MILESTONES, MILESTONE_BY_ID } from '../content/milestones';
import {
  MAX_CHANCE,
  MAX_SKILL,
  PROPOSAL_COOLDOWN_DAYS,
  PROPOSAL_COST_MILESTONE,
  PROPOSAL_COST_SKILL,
  SUPPORT_STEPS,
  TRY_ALONE_BASE,
  TRY_ALONE_PER_SKILL,
  barSize,
} from '../content/tuning';
import { random } from './rng';
import { unlockedActivities } from './selectors';
import type { GameState, ProposalSubject, Resident } from './state';
import { levelUp, log } from './tick';

export function proposalCost(subject: ProposalSubject): number {
  return subject.kind === 'milestone' ? PROPOSAL_COST_MILESTONE : PROPOSAL_COST_SKILL;
}

export function baseChance(r: Resident, subject: ProposalSubject): number {
  if (subject.kind === 'milestone') return MILESTONE_BY_ID[subject.milestone].baseChance;
  return TRY_ALONE_BASE + TRY_ALONE_PER_SKILL * r.skill[subject.activity];
}

export function chance(r: Resident, subject: ProposalSubject, step: number): number {
  return Math.min(MAX_CHANCE, baseChance(r, subject) + (SUPPORT_STEPS[step]?.bonus ?? 0));
}

export function oddsWord(p: number): string {
  if (p < 0.4) return 'a stretch';
  if (p < 0.7) return 'maybe';
  return 'likely';
}

export function askText(subject: ProposalSubject): string {
  return subject.kind === 'milestone'
    ? MILESTONE_BY_ID[subject.milestone].ask
    : ACTIVITY_BY_ID[subject.activity].ask;
}

/** Everything the resident could propose right now. Milestones come first when open. */
export function eligibleSubjects(r: Resident): ProposalSubject[] {
  const routinesDone = unlockedActivities(r).every((a) => r.skill[a.id] >= MAX_SKILL);
  const milestones: ProposalSubject[] = MILESTONES.filter(
    (m) =>
      !r.milestones.includes(m.id) &&
      r.unlockedRung >= m.needsRung &&
      (!m.after || r.milestones.includes(m.after)) &&
      (!m.needsAllRoutines || routinesDone),
  ).map((m) => ({ kind: 'milestone', milestone: m.id }));
  const tries: ProposalSubject[] = unlockedActivities(r)
    .filter((a) => r.skill[a.id] < MAX_SKILL)
    .map((a) => ({ kind: 'try', activity: a.id }));
  return [...milestones, ...tries];
}

/** Open a proposal when the cooldown is over and the resident has the overskudd. */
export function maybePropose(state: GameState) {
  if (state.proposal || state.discharge) return;
  if (state.minute - state.lastProposalMinute < PROPOSAL_COOLDOWN_DAYS * 1440) return;
  const r = state.resident;
  const options = eligibleSubjects(r).filter((sub) => r.overskudd >= proposalCost(sub));
  if (options.length === 0) return;
  const milestone = options.find((o) => o.kind === 'milestone');
  const subject = milestone ?? options[Math.floor(random(state) * options.length)]!;
  state.proposal = { subject };
  state.lastProposalMinute = state.minute;
  state.resumeSpeed = state.speed || state.resumeSpeed;
  state.speed = 0;
}

export function canSupport(state: GameState, step: number): boolean {
  return state.budget >= (SUPPORT_STEPS[step]?.kr ?? Infinity);
}

const pips = (n: number) =>
  Array.from({ length: MAX_SKILL }, (_, i) => (i < n ? '●' : '○')).join('');

/** What the player gets if it works, in one line. */
export function rewardText(r: Resident, subject: ProposalSubject): string {
  if (subject.kind === 'milestone') {
    const m = MILESTONE_BY_ID[subject.milestone];
    return `${m.label} done. Needed before ${r.name} can be discharged as "${m.forTier}".`;
  }
  const a = ACTIVITY_BY_ID[subject.activity];
  const next = r.skill[a.id] + 1;
  if (next >= MAX_SKILL) return `${a.label} becomes automatic.`;
  return `${a.label} gets easier: ${barSize(r.skill[a.id])} → ${barSize(next)} nudges.`;
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
  if (p.subject.kind === 'milestone') {
    const m = MILESTONE_BY_ID[p.subject.milestone];
    if (won) {
      r.milestones.push(m.id);
      p.gain = reward;
    }
    p.result = won ? m.success : m.failure;
    log(state, p.result);
  } else {
    const a = ACTIVITY_BY_ID[p.subject.activity];
    p.result = won ? a.askSuccess : a.askFailure;
    log(state, p.result);
    if (won) {
      p.gain = `${a.label} ${pips(r.skill[a.id])} → ${pips(r.skill[a.id] + 1)}`;
      levelUp(state, r, a);
    }
  }
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
