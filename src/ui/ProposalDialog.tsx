import { SUPPORT_STEPS } from '../content/tuning';
import {
  accept,
  askText,
  canSupport,
  chance,
  closeProposal,
  decline,
  oddsWord,
  proposalCost,
  rewardText,
} from '../sim/proposals';
import { act, useGame } from '../store';

const CHOICE_LABELS = ['Go for it', 'Pay for some help', 'Pay for proper help'];

export function ProposalDialog() {
  const s = useGame();
  const p = s.proposal;
  const r = p && s.beds[p.bed];
  if (!p || !r) return null;

  return (
    <div class="overlay">
      <div class="dialog" role="dialog" aria-modal="true">
        <p class="muted">{r.name} has something to say.</p>
        <blockquote>“{askText(p.subject)}”</blockquote>

        {!p.outcome && (
          <>
            <dl class="stakes">
              <dt>If it works</dt>
              <dd class="win">{rewardText(r, p.subject)}</dd>
              <dt>If it fails</dt>
              <dd>The money is gone. {r.name} can try again another day.</dd>
              <dt>Either way</dt>
              <dd>Uses {proposalCost(p.subject)} overskudd.</dd>
            </dl>
            <div class="choices">
              {SUPPORT_STEPS.map((step, i) => (
                <button
                  class="choice"
                  disabled={!canSupport(s, i)}
                  onClick={() => act((g) => accept(g, i))}
                >
                  <span>{CHOICE_LABELS[i]}</span>
                  <span class="odds">
                    {step.kr > 0 && <span class="muted">{step.kr} kr · </span>}
                    {oddsWord(chance(r, p.subject, i))}
                  </span>
                </button>
              ))}
              <button class="choice quiet" onClick={() => act(decline)}>
                Not now
              </button>
            </div>
          </>
        )}

        {p.outcome && (
          <>
            <p class={`outcome ${p.outcome}`}>
              {p.outcome === 'declined' ? 'Maybe another time.' : p.result}
            </p>
            {p.gain && <p class="gain">{p.gain}</p>}
            <button class="choice" onClick={() => act(closeProposal)}>
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
