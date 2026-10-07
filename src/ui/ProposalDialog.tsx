import { SUPPORT_STEPS } from '../content/tuning';
import {
  accept,
  askText,
  canSupport,
  chance,
  closeProposal,
  decline,
  oddsWord,
} from '../sim/proposals';
import { act, useGame } from '../store';

const CHOICE_LABELS = ['Go for it', 'With some support', 'With a lot of support'];

export function ProposalDialog() {
  const s = useGame();
  const p = s.proposal;
  if (!p) return null;
  const r = s.resident;

  return (
    <div class="overlay">
      <div class="dialog" role="dialog" aria-modal="true">
        <p class="muted">{r.name} has something to say.</p>
        <blockquote>“{askText(p.subject)}”</blockquote>

        {!p.outcome && (
          <div class="choices">
            {SUPPORT_STEPS.map((step, i) => (
              <button
                class="choice"
                disabled={!canSupport(s, i)}
                onClick={() => act((g) => accept(g, i))}
              >
                <span>{CHOICE_LABELS[i]}</span>
                <span class="odds">
                  {step.omsorg > 0 && <span class="muted">{step.omsorg} omsorg · </span>}
                  {oddsWord(chance(r, p.subject, i))}
                </span>
              </button>
            ))}
            <button class="choice quiet" onClick={() => act(decline)}>
              Not now
            </button>
          </div>
        )}

        {p.outcome && (
          <>
            <p class={`outcome ${p.outcome}`}>
              {p.outcome === 'declined' ? 'Maybe another time.' : p.result}
            </p>
            <button class="choice" onClick={() => act(closeProposal)}>
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
