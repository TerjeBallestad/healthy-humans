import { useEffect, useState } from 'preact/hooks';
import { ARCHETYPE_BY_ID } from '../content/archetypes';
import {
  MILESTONE_BY_ID,
  PHASES,
  PHASE_LABEL,
  REACTION_FACE,
  type MilestoneId,
} from '../content/milestones';
import { OVERSKUDD_CAP } from '../content/tuning';
import {
  accept,
  baseDifficulty,
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
  pick,
  proposalCaseWorkerSupport,
  proposalCost,
  wagerSupport,
} from '../sim/proposals';
import type { Resident } from '../sim/state';
import { act, useGame } from '../store';
import { PROPOSAL, UNITS } from '../content/text';
import { GRACE_MS } from './Tips';
import { IdentityChip } from './IdentityChip';

export function ProposalDialog() {
  const s = useGame();
  const p = s.proposal;
  const r = p && s.beds[p.bed];
  if (!p || !r) return null;
  // The tick the proposal opened names it. A new one starts with a fresh wager.
  return <SceneCard key={`${p.bed}-${r.lastProposalTick}`} />;
}

function SceneCard() {
  // Read the state here, not from props: the props would not change, so the card would not re-render.
  const s = useGame();
  const p = s.proposal!;
  const r = s.beds[p.bed]!;
  const m = p.pick ? MILESTONE_BY_ID[p.pick] : null;
  const [kr, setKr] = useState(0);
  const rolled = p.outcome === 'success' || p.outcome === 'failure';
  const cw = p.caseWorker ? s.staff.find((x) => x.name === p.caseWorker) : undefined;
  const cwSupport = proposalCaseWorkerSupport(s);
  // Fast clicking on the cards must not skip the card or its result. Clicks wait GRACE_MS each time.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), GRACE_MS);
    return () => clearTimeout(t);
  }, [p.outcome]);
  const reaction =
    rolled && m
      ? REACTION_FACE[p.outcome as 'success' | 'failure'][fitLevel(fitOf(r.identity, m.id))]
      : null;

  return (
    <div class="overlay" onClick={() => ready && p.outcome && act(closeProposal)}>
      <div
        class="dialog scene"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="stage">
          <span class="face" aria-label={r.name}>
            <span class={reaction ? 'base gone' : 'base'}>{ARCHETYPE_BY_ID[r.archetype].face}</span>
            {reaction && <span class="react">{reaction}</span>}
          </span>
          <span class="path" aria-hidden="true" />
          <span class="place">
            <span class="place-icon" aria-hidden="true">
              {m?.placeIcon ?? '?'}
            </span>
            <span class="muted">{m?.place ?? m?.label ?? ''}</span>
          </span>
        </div>
        <p class="who">
          {r.name} <IdentityChip id={r.identity} />
        </p>
        {m?.ask && <blockquote>“{m.ask}”</blockquote>}

        <Hand hand={p.hand} picked={p.pick} locked={!!p.outcome} />

        <OverskuddDrain before={p.overskuddBefore} cost={proposalCost()} paid={rolled} />
        <Track r={r} current={p.pick} ticking={p.outcome === 'success'} />

        {cw && (
          <p class="case-worker">
            <span aria-hidden="true">{cw.face}</span> {cw.name}
          </p>
        )}
        {m && <Odds r={r} id={m.id} support={cwSupport ?? wagerSupport(m.id, kr)} />}

        {!p.outcome && (
          <>
            {m && cwSupport === null && <Wager id={m.id} kr={kr} setKr={setKr} />}
            <div class="choices row">
              <button
                class="choice"
                data-tip="go"
                disabled={!ready || !m || (cwSupport === null && !canWager(s, kr))}
                onClick={() => act((g) => accept(g, cwSupport === null ? kr : 0))}
              >
                <span>{PROPOSAL.go}</span>
                {cwSupport === null && (
                  <span class="odds">{kr > 0 ? UNITS.kr(kr) : PROPOSAL.alone}</span>
                )}
              </button>
              <button class="choice quiet" disabled={!ready} onClick={() => act(decline)}>
                {PROPOSAL.notNow}
              </button>
            </div>
          </>
        )}

        {p.outcome && (
          <div class={rolled ? 'result rolled' : 'result'}>
            <p class={`outcome ${p.outcome}`}>
              {p.outcome === 'declined' ? PROPOSAL.declined : p.result}
            </p>
            <button class="choice" disabled={!ready} onClick={() => act(closeProposal)}>
              {PROPOSAL.continue}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** The cards the resident offers. The player picks one. */
function Hand({
  hand,
  picked,
  locked,
}: {
  hand: MilestoneId[];
  picked?: MilestoneId;
  locked: boolean;
}) {
  return (
    <div class="hand" data-tip="hand" role="radiogroup">
      {hand.map((id) => {
        const m = MILESTONE_BY_ID[id];
        return (
          <button
            class={id === picked ? 'mcard on' : 'mcard'}
            role="radio"
            aria-checked={id === picked}
            disabled={locked && id !== picked}
            onClick={() => !locked && act((g) => pick(g, id))}
          >
            <span class="mcard-icon" aria-hidden="true">
              {m.placeIcon}
            </span>
            <span class="mcard-label">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** The tug of war: the resident's competence against the card's difficulty after support. */
function Odds({ r, id, support }: { r: Resident; id: MilestoneId; support: number }) {
  const s = useGame();
  const p = s.proposal!;
  const rolled = p.outcome === 'success' || p.outcome === 'failure';
  // After the roll, show what was rolled. A failed try has already raised the competence.
  const c = p.competence ?? competence(r, id);
  const d = p.difficulty ?? difficulty(id, support);
  const odds = p.chance ?? oddsOf(c, d);
  const base = baseDifficulty(id);
  return (
    <>
      <div class="odds-bar" data-tip="odds" aria-label={PROPOSAL.chance(Math.round(odds * 100))}>
        <span class="zone" style={{ width: `${odds * 100}%` }} />
        {rolled && <span class="marker" style={{ '--roll': `${p.roll! * 100}%` }} />}
        <span class="odds-label">{Math.round(odds * 100)}%</span>
      </div>
      <div class="tug muted">
        <span>
          {PROPOSAL.competence} <strong>{Math.round(c)}</strong>
        </span>
        <span>
          {PROPOSAL.difficulty} {d < base - 0.5 && <s>{base}</s>} <strong>{Math.round(d)}</strong>
        </span>
      </div>
    </>
  );
}

/** The kroner slider, before the first case worker. */
function Wager({ id, kr, setKr }: { id: MilestoneId; kr: number; setKr: (v: number) => void }) {
  const s = useGame();
  const sure = maxKr(id);
  const cap = maxWager(s);
  return (
    <div class="wager">
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
        <span>{UNITS.kr(0)}</span>
        <span class={kr >= sure ? 'sure on' : 'sure'}>{UNITS.kr(sure)}</span>
      </span>
    </div>
  );
}

/** The overskudd bar with the cost marked at its end. The cost drains when the player goes. */
function OverskuddDrain({ before, cost, paid }: { before: number; cost: number; paid: boolean }) {
  const pct = (v: number) => `${(v / OVERSKUDD_CAP) * 100}%`;
  return (
    <div class="drain" data-tip="drain">
      <span class="label">{PROPOSAL.overskudd}</span>
      <div class="meter">
        <div
          class={paid ? 'fill paid' : 'fill'}
          style={{ '--from': pct(before), '--to': pct(before - cost) }}
        />
        {!paid && <div class="price" style={{ left: pct(before - cost), width: pct(cost) }} />}
      </div>
      <span class="cost">−{cost}</span>
    </div>
  );
}

/** The three phases. A done phase shows its card. The current one ticks after the roll when it works. */
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
