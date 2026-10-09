import { ARCHETYPE_BY_ID } from '../content/archetypes';
import { TIER_BY_ID } from '../content/tiers';
import {
  cancelDischarge,
  closeDischarge,
  nextTier,
  signDischarge,
  tierMissing,
  tierTax,
  waitCost,
} from '../sim/discharge';
import { act, useGame } from '../store';

export function DischargeDialog() {
  const s = useGame();
  const d = s.discharge;
  const r = d && s.beds[d.bed];
  if (!d || !r) return null;
  const tier = TIER_BY_ID[d.tier];
  const better = nextTier(r);
  const first = s.waiting[0];
  const cost = first ? waitCost(first.health) : null;

  return (
    <div class="overlay">
      <div class="dialog" role="dialog" aria-modal="true">
        {!d.signed && (
          <>
            <p class="muted vedtak-head">Vedtak om utskriving</p>
            <dl class="stakes">
              <dt>Resident</dt>
              <dd>{r.name}</dd>
              <dt>Assessed as</dt>
              <dd>{tier.label.toLowerCase()}</dd>
              <dt>Tax</dt>
              <dd class="win">+{tierTax(r, tier.id)} kr per week, for the rest of the game</dd>
              {better && (
                <>
                  <dt>If you wait</dt>
                  <dd>
                    {better.label.toLowerCase()} pays +{tierTax(r, better.id)} kr per week. Needs{' '}
                    {tierMissing(r, better.id).join(', ')}.
                  </dd>
                </>
              )}
              {first && (
                <>
                  <dt>First in line</dt>
                  <dd class="warn">
                    {ARCHETYPE_BY_ID[first.archetype].name}, health {Math.round(first.health)}.{' '}
                    {cost!.needLoss > 0 &&
                      `Arrives with needs −${cost!.needLoss} and decay +${cost!.strainPct}%. `}
                    Every week makes it worse.
                  </dd>
                </>
              )}
            </dl>
            <div class="choices">
              <button class="choice" onClick={() => act(signDischarge)}>
                <span>Sign</span>
              </button>
              <button class="choice quiet" onClick={() => act(cancelDischarge)}>
                Not yet
              </button>
            </div>
          </>
        )}

        {d.signed && (
          <>
            <p class="muted">Some time later.</p>
            <blockquote>
              {ARCHETYPE_BY_ID[r.archetype].glimpse[d.tier].map((line) => (
                <span class="glimpse">{line}</span>
              ))}
            </blockquote>
            <p class="gain">+{tierTax(r, tier.id)} kr per week</p>
            <button class="choice" onClick={() => act(closeDischarge)}>
              The bed is free
            </button>
          </>
        )}
      </div>
    </div>
  );
}
