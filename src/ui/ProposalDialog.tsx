import { useEffect, useState } from 'preact/hooks';
import { ARCHETYPE_BY_ID } from '../content/archetypes';
import {
  MILESTONE_BY_ID,
  PHASES,
  PHASE_LABEL,
  PHASE_QUESTION,
  REACTION_FACE,
  REACTION_FIT_LINE,
  REACTION_RESULT_LINE,
  type MilestoneId,
} from '../content/milestones';
import {
  accept,
  canWager,
  closeProposal,
  competence,
  decline,
  difficulty,
  fitLevel,
  fitOf,
  maxKr,
  maxWager,
  odds as oddsOf,
  phaseOf,
  pick,
  proposalCaseWorkerSupport,
  proposalCost,
  readiness,
  wagerSupport,
} from '../sim/proposals';
import type { Resident } from '../sim/state';
import { act, useGame } from '../store';
import { PROPOSAL, UNITS } from '../content/text';
import { GRACE_MS } from './Tips';
import { IdentityChip } from './IdentityChip';

/** Real milliseconds the roll shows before the patient's reaction. The marker takes 1.3 s. */
const ATTEMPT_MS = 1800;

export function ProposalDialog() {
  const s = useGame();
  const p = s.proposal;
  const r = p && s.beds[p.bed];
  if (!p || !r) return null;
  // The tick the proposal opened names it. A new one starts with a fresh wager.
  return <SceneCard key={`${p.bed}-${r.lastProposalTick}`} />;
}

/**
 * One decision at a time: the question and the hand, then the patient's answer and the preparation,
 * then the attempt, then the reaction.
 */
function SceneCard() {
  // Read the state here, not from props: the props would not change, so the card would not re-render.
  const s = useGame();
  const p = s.proposal!;
  const r = s.beds[p.bed]!;
  const m = p.pick ? MILESTONE_BY_ID[p.pick] : null;
  const [kr, setKr] = useState(0);
  const [answering, setAnswering] = useState(false);
  const rolled = p.outcome === 'success' || p.outcome === 'failure';
  const [reacting, setReacting] = useState(false);
  const step = rolled ? (reacting ? 'reaction' : 'attempt') : answering && m ? 'answer' : 'ask';
  // Fast clicking must not skip a step or its result. Clicks wait GRACE_MS on each step.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), GRACE_MS);
    return () => clearTimeout(t);
  }, [step, p.outcome]);
  useEffect(() => {
    if (!rolled) return;
    const t = setTimeout(() => setReacting(true), ATTEMPT_MS);
    return () => clearTimeout(t);
  }, [rolled]);
  const done = step === 'reaction' || p.outcome === 'declined';
  const reaction =
    step === 'reaction' && m
      ? REACTION_FACE[p.outcome as 'success' | 'failure'][fitLevel(fitOf(r.identity, m.id))]
      : null;

  return (
    <div class="overlay" onClick={() => ready && done && act(closeProposal)}>
      <div
        class={`dialog scene ${step}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="stage">
          <span class="face" aria-label={r.name}>
            {reaction ? (
              <span class="react">{reaction}</span>
            ) : (
              <span class="base">{ARCHETYPE_BY_ID[r.archetype].face}</span>
            )}
          </span>
          <span class="path" aria-hidden="true" />
          <span class="place">
            <span class="place-icon" aria-hidden="true">
              {(step !== 'ask' && m?.placeIcon) || '?'}
            </span>
            <span class="muted">{step !== 'ask' ? (m?.place ?? m?.label) : ''}</span>
          </span>
        </div>
        <p class="who">
          {r.name} <IdentityChip id={r.identity} />
        </p>

        {step === 'ask' && (
          <Ask
            r={r}
            ready={ready}
            onPick={(id) => {
              act((g) => pick(g, id));
              setAnswering(true);
            }}
          />
        )}
        {step === 'answer' && m && (
          <Answer
            r={r}
            id={m.id}
            kr={kr}
            setKr={setKr}
            ready={ready}
            onBack={() => setAnswering(false)}
          />
        )}
        {step === 'attempt' && m && (
          <>
            <blockquote>{PROPOSAL.attempt(m.label, r.name)}</blockquote>
            <Odds r={r} id={m.id} support={0} />
          </>
        )}
        {step === 'reaction' && m && <Reaction r={r} id={m.id} ready={ready} />}
        {p.outcome === 'declined' && (
          <div class="result">
            <p class="outcome">{PROPOSAL.declined}</p>
            <button class="choice" disabled={!ready} onClick={() => act(closeProposal)}>
              {PROPOSAL.continue}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Step 1: the phase as a question, and the hand to answer it with. */
function Ask({
  r,
  ready,
  onPick,
}: {
  r: Resident;
  ready: boolean;
  onPick: (id: MilestoneId) => void;
}) {
  const s = useGame();
  const p = s.proposal!;
  if (p.outcome) return null;
  const phase = phaseOf(r)!;
  return (
    <>
      <p class="question" data-tip="question">
        {PHASE_QUESTION[phase](r.name)}
      </p>
      <div class="hand" data-tip="hand" role="radiogroup">
        {p.hand.map((id) => {
          const m = MILESTONE_BY_ID[id];
          return (
            <button
              class={id === p.pick ? 'mcard on' : 'mcard'}
              role="radio"
              aria-checked={id === p.pick}
              disabled={!ready}
              onClick={() => onPick(id)}
            >
              <span class="mcard-icon" aria-hidden="true">
                {m.placeIcon}
              </span>
              <span class="mcard-label">{m.label}</span>
            </button>
          );
        })}
      </div>
      <button class="choice quiet" disabled={!ready} onClick={() => act(decline)}>
        {PROPOSAL.notNow}
      </button>
    </>
  );
}

/** Step 2: the patient answers, sure or not, and the player prepares them or the case worker does. */
function Answer({
  r,
  id,
  kr,
  setKr,
  ready,
  onBack,
}: {
  r: Resident;
  id: MilestoneId;
  kr: number;
  setKr: (v: number) => void;
  ready: boolean;
  onBack: () => void;
}) {
  const s = useGame();
  const m = MILESTONE_BY_ID[id];
  const cwSupport = proposalCaseWorkerSupport(s);
  const cw = s.proposal!.caseWorker ? s.staff.find((x) => x.name === s.proposal!.caseWorker) : null;
  const support = cwSupport ?? wagerSupport(id, kr);
  const chance = oddsOf(competence(r, id), difficulty(id, support));
  const lines = support > 0 ? PROPOSAL.readiness.prepared : PROPOSAL.readiness.alone;
  return (
    <>
      <blockquote>
        “{PROPOSAL.answer(m.label)} {lines[readiness(chance)]}”
      </blockquote>
      {cw && (
        <p class="case-worker">
          <span aria-hidden="true">{cw.face}</span> {PROPOSAL.caseWorker(cw.name, r.name)}
        </p>
      )}
      <Odds r={r} id={id} support={support} />
      {cwSupport === null && <Wager id={id} kr={kr} setKr={setKr} />}
      <div class="choices row">
        <button
          class="choice"
          data-tip="go"
          disabled={!ready || (cwSupport === null && !canWager(s, kr))}
          onClick={() => act((g) => accept(g, cwSupport === null ? kr : 0))}
        >
          <span>{PROPOSAL.go}</span>
          <span class="odds muted">
            {kr > 0 && `${UNITS.kr(kr)} · `}
            {PROPOSAL.cost(proposalCost())}
          </span>
        </button>
        <button class="choice quiet" disabled={!ready} onClick={onBack}>
          {PROPOSAL.back}
        </button>
      </div>
    </>
  );
}

/** Step 4: what the patient says, a plain stamp for the result and the fit, and the phases. */
function Reaction({ r, id, ready }: { r: Resident; id: MilestoneId; ready: boolean }) {
  const s = useGame();
  const p = s.proposal!;
  const won = p.outcome === 'success';
  const fit = fitLevel(fitOf(r.identity, id));
  return (
    <div class="result">
      <blockquote>
        “{REACTION_FIT_LINE[fit]} {REACTION_RESULT_LINE[won ? 'success' : 'failure'][fit]}”
      </blockquote>
      <p class="stamps">
        <span class={won ? 'stamp good' : 'stamp poor'}>
          {won ? '✓' : '✗'} {won ? PROPOSAL.worked : PROPOSAL.failed}
        </span>
        <span class={`stamp ${fit}`}>
          {REACTION_FACE[won ? 'success' : 'failure'][fit]} {PROPOSAL.fit[fit]}
        </span>
      </p>
      <Track r={r} current={id} ticking={won} />
      <button class="choice" disabled={!ready} onClick={() => act(closeProposal)}>
        {PROPOSAL.continue}
      </button>
    </div>
  );
}

/** The odds as a bar. After the roll, a marker rolls along it and stops at the roll. */
function Odds({ r, id, support }: { r: Resident; id: MilestoneId; support: number }) {
  const s = useGame();
  const p = s.proposal!;
  const rolled = p.outcome === 'success' || p.outcome === 'failure';
  const odds = p.chance ?? oddsOf(competence(r, id), difficulty(id, support));
  return (
    <div class="odds-bar" data-tip="odds" aria-label={PROPOSAL.chance(Math.round(odds * 100))}>
      <span class="zone" style={{ width: `${odds * 100}%` }} />
      {rolled && <span class="marker" style={{ '--roll': `${p.roll! * 100}%` }} />}
      <span class="odds-label">{Math.round(odds * 100)}%</span>
    </div>
  );
}

/** The kroner slider for preparation, before the first case worker. */
function Wager({ id, kr, setKr }: { id: MilestoneId; kr: number; setKr: (v: number) => void }) {
  const s = useGame();
  const sure = maxKr(id);
  const cap = maxWager(s);
  return (
    <div class="wager">
      <span class="label muted">{PROPOSAL.preparation}</span>
      <div class="slider" data-tip="wager" style={{ '--val': kr / sure, '--cap': cap / sure }}>
        {cap < sure && <span class="beyond" aria-hidden="true" />}
        {cap < sure && <span class="cap-mark" aria-hidden="true" />}
        <input
          type="range"
          min={0}
          max={sure}
          step={1}
          value={kr}
          aria-label={PROPOSAL.krToSpend}
          onInput={(e) => {
            // The knob stops at the budget. Reset the input too, so it cannot run past.
            const v = Math.min(cap, Number(e.currentTarget.value));
            e.currentTarget.value = String(v);
            setKr(v);
          }}
        />
      </div>
      <span class="wager-ends muted">
        <span>{PROPOSAL.none}</span>
        <span class={kr >= sure ? 'sure on' : 'sure'}>{UNITS.kr(sure)}</span>
      </span>
    </div>
  );
}

/** The three phases. A done phase shows its card. The current one ticks when it works. */
function Track({ r, current, ticking }: { r: Resident; current?: MilestoneId; ticking: boolean }) {
  const phaseNow = current ? MILESTONE_BY_ID[current].phase : null;
  return (
    <ol class="track" data-tip="track">
      {PHASES.map((phase) => {
        const done = r.milestones.find((id) => MILESTONE_BY_ID[id].phase === phase);
        const now = phase === phaseNow;
        const label = done ? MILESTONE_BY_ID[done].label : PHASE_LABEL[phase];
        const cls = ['step', done && !now && 'done', now && 'now', now && ticking && 'tick'];
        return (
          <li class={cls.filter(Boolean).join(' ')}>
            <span class="dot" aria-hidden="true" />
            <span class="name">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
