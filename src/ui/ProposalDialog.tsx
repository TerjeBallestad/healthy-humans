import { useState } from 'preact/hooks';
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

export function ProposalDialog() {
  const s = useGame();
  const p = s.proposal;
  const r = p && s.beds[p.bed];
  if (!p || !r) return null;
  // The game is paused, so the tick names this proposal. A new one starts with a fresh wager.
  return <SceneCard key={`${p.bed}-${s.tick}`} />;
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

  return (
    <div class="overlay">
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

        <div class="odds-bar" data-tip="odds" aria-label={`Chance ${Math.round(odds * 100)}%`}>
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
                  aria-label="Kroner to spend"
                  onInput={(e) => {
                    // The knob stops at the budget. Reset the input too, so it cannot run past.
                    const v = Math.min(cap, Number(e.currentTarget.value));
                    e.currentTarget.value = String(v);
                    setKr(v);
                  }}
                />
              </div>
              <span class="wager-ends muted">
                <span>0 kr</span>
                <span class={kr >= sure ? 'sure on' : 'sure'}>{sure} kr: sure</span>
              </span>
            </div>
            <div class="choices row">
              <button
                class="choice"
                data-tip="go"
                disabled={!canWager(s, kr)}
                onClick={() => act((g) => accept(g, kr))}
              >
                <span>Go</span>
                <span class="odds">{kr > 0 ? `${kr} kr` : 'alone'}</span>
              </button>
              <button class="choice quiet" onClick={() => act(decline)}>
                Not now
              </button>
            </div>
          </>
        )}

        {p.outcome && (
          <div class={rolled ? 'result rolled' : 'result'}>
            <p class={`outcome ${p.outcome}`}>
              {p.outcome === 'declined' ? 'Maybe another time.' : p.result}
            </p>
            <button class="choice" onClick={() => act(closeProposal)}>
              Continue
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
      <span class="label">Overskudd</span>
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
