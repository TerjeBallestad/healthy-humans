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
import { DISCHARGE, UNITS } from '../content/text';

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
            <p class="muted vedtak-head">{DISCHARGE.heading}</p>
            <dl class="stakes">
              <dt>{DISCHARGE.resident}</dt>
              <dd>{r.name}</dd>
              <dt>{DISCHARGE.assessedAs}</dt>
              <dd>{tier.label.toLowerCase()}</dd>
              <dt>{DISCHARGE.tax}</dt>
              <dd class="win">{DISCHARGE.taxValue(tierTax(r, tier.id))}</dd>
              {better && (
                <>
                  <dt>{DISCHARGE.ifYouWait}</dt>
                  <dd>
                    {DISCHARGE.better(
                      better.label,
                      tierTax(r, better.id),
                      tierMissing(r, better.id),
                    )}
                  </dd>
                </>
              )}
              {first && (
                <>
                  <dt>{DISCHARGE.firstInLine}</dt>
                  <dd class="warn">
                    {DISCHARGE.firstHealth(
                      ARCHETYPE_BY_ID[first.archetype].name,
                      Math.round(first.health),
                    )}
                    {cost!.needLoss > 0 && DISCHARGE.firstCost(cost!.needLoss, cost!.strainPct)}
                    {DISCHARGE.worse}
                  </dd>
                </>
              )}
            </dl>
            <div class="choices">
              <button class="choice" onClick={() => act(signDischarge)}>
                <span>{DISCHARGE.sign}</span>
              </button>
              <button class="choice quiet" onClick={() => act(cancelDischarge)}>
                {DISCHARGE.notYet}
              </button>
            </div>
          </>
        )}

        {d.signed && (
          <>
            <p class="muted">{DISCHARGE.later}</p>
            <blockquote>
              {ARCHETYPE_BY_ID[r.archetype].glimpse[d.tier].map((line) => (
                <span class="glimpse">{line}</span>
              ))}
            </blockquote>
            <p class="gain">{UNITS.plusKrPerWeekLong(tierTax(r, tier.id))}</p>
            <button class="choice" onClick={() => act(closeDischarge)}>
              {DISCHARGE.bedFree}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
