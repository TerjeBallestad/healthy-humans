import { useEffect, useState } from 'preact/hooks';
import { ARCHETYPE_BY_ID } from '../content/archetypes';
import { MILESTONES, MILESTONE_BY_ID } from '../content/milestones';
import { OVERSKUDD_CAP } from '../content/tuning';
import {
  accept,
  canWager,
  chance,
  closeProposal,
  decline,
  maxWager,
  proposalCost,
  surePrice,
} from '../sim/proposals';
import type { Resident } from '../sim/state';
import { act, useGame } from '../store';
import { PROPOSAL, UNITS } from '../content/text';
import { GRACE_MS } from './Tips';


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
  const m = MILESTONE_BY_ID[p.subject.milestone];
  const sure = surePrice(p.subject);
  const cap = maxWager(s);
  const [kr, setKr] = useState(0);
  const odds = p.chance ?? chance(r, p.subject, kr);
  const rolled = p.outcome === 'success' || p.outcome === 'failure';
  const cw = p.caseWorker ? s.staff.find((x) => x.name === p.caseWorker) : undefined;
  // Fast clicking on the cards must not skip the card or its result. Clicks wait GRACE_MS each time.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), GRACE_MS);
    return () => clearTimeout(t);
  }, [p.outcome]);

  return (
    <div class="overlay" onClick={() => ready && p.caseWorker && act(closeProposal)}>
      <div class="dialog scene" role="dialog" aria-modal="true">
        <div class="stage">
          <span class="face" aria-label={r.name}>
            {ARCHETYPE_BY_ID[r.archetype].face}
          </span>
          <span class="path" aria-hidden="true" />
          <span class="place">
            <span class="place-icon" aria-hidden="true">
              {m.placeIcon}
            </span>
            <span class="muted">{m.place}</span>
          </span>
        </div>
        <blockquote>“{m.ask}”</blockquote>

        <OverskuddDrain before={p.overskuddBefore} cost={proposalCost(p.subject)} paid={rolled} />
        <Track r={r} current={m.id} ticking={p.outcome === 'success'} />

        {cw && (
          <p class="case-worker">
            <span aria-hidden="true">{cw.face}</span> {cw.name}
          </p>
        )}
        <div class="odds-bar" data-tip="odds" aria-label={PROPOSAL.chance(Math.round(odds * 100))}>
          <span class="zone" style={{ width: `${odds * 100}%` }} />
          {rolled && <span class="marker" style={{ '--roll': `${p.roll! * 100}%` }} />}
          <span class="odds-label">{Math.round(odds * 100)}%</span>
        </div>

        {!p.outcome && (
          <>
            <div class="wager">
              <div
                class="slider"
                data-tip="wager"
                style={{ '--val': kr / sure, '--cap': cap / sure }}
              >
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
                <span class={kr >= sure ? 'sure on' : 'sure'}>{PROPOSAL.sure(sure)}</span>
              </span>
            </div>
            <div class="choices row">
              <button
                class="choice"
                data-tip="go"
                disabled={!ready || !canWager(s, kr)}
                onClick={() => act((g) => accept(g, kr))}
              >
                <span>{PROPOSAL.go}</span>
                <span class="odds">{kr > 0 ? UNITS.kr(kr) : PROPOSAL.alone}</span>
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

/** The milestones in order. The current one ticks after the roll when it works. */
function Track({ r, current, ticking }: { r: Resident; current: string; ticking: boolean }) {
  return (
    <ol class="track" data-tip="track">
      {MILESTONES.map((m) => {
        const now = m.id === current;
        const done = r.milestones.includes(m.id) && !now;
        const cls = ['step', done && 'done', now && 'now', now && ticking && 'tick'];
        return (
          <li class={cls.filter(Boolean).join(' ')}>
            <span class="dot" aria-hidden="true" />
            <span class="name">{m.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
