import { ARCHETYPE_BY_ID } from '../content/archetypes';
import { TIER_BY_ID } from '../content/tiers';
import {
  admitNext,
  cancelDischarge,
  nextArchetype,
  nextTier,
  nextWaitWeeks,
  signDischarge,
  waitCost,
} from '../sim/discharge';
import { act, useGame } from '../store';

export function DischargeDialog() {
  const s = useGame();
  const d = s.discharge;
  if (!d) return null;
  const r = s.resident;
  const tier = TIER_BY_ID[d.tier];
  const better = nextTier(r);
  const next = nextArchetype(s);
  const waited = nextWaitWeeks(s);
  const cost = waitCost(waited);

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
              <dd class="win">+{tier.taxPerWeek} kr per week, for the rest of the game</dd>
              {better && (
                <>
                  <dt>If you wait</dt>
                  <dd>
                    {better.label.toLowerCase()} pays +{better.taxPerWeek} kr per week. Needs{' '}
                    {better.needs}.
                  </dd>
                </>
              )}
              <dt>Next in the bed</dt>
              <dd>
                {next.name}. {next.intro}
              </dd>
              <dt>Waited</dt>
              <dd class="warn">
                {waited} weeks.{' '}
                {waited > 0
                  ? `Arrives with needs −${cost.needLoss} and decay +${cost.strainPct}% for a while. `
                  : ''}
                Every week you wait makes it worse.
              </dd>
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
            <p class="gain">+{tier.taxPerWeek} kr per week</p>
            <button class="choice" onClick={() => act(admitNext)}>
              {next.name} is at the door
            </button>
          </>
        )}
      </div>
    </div>
  );
}
