import { STAFF_WAGE_PER_WEEK, trainCost } from '../content/tuning';
import { TIER_BY_ID } from '../content/tiers';
import { COACH_STEPS, UPGRADES } from '../content/upgrades';
import { buyUpgrade, hire, toggleCoachStep } from '../sim/actions';
import { taxPerWeek } from '../sim/discharge';
import {
  canAffordWage,
  canBuy,
  canHire,
  hireCost,
  offered,
  staffNudgesPerSecond,
} from '../sim/institution';
import { act, useGame } from '../store';

export function InstitutionPanel() {
  const s = useGame();
  const shop = UPGRADES.filter((u) => !u.coachStep && offered(s, u.id));
  return (
    <section class="panel institution">
      {s.discharged.length > 0 && (
        <>
          <h3>Discharged</h3>
          <p>
            {s.discharged
              .map((d) => `${d.name} (${TIER_BY_ID[d.tier].label.toLowerCase()})`)
              .join(', ')}
            <span class="muted"> · +{taxPerWeek(s)} kr/week in tax</span>
          </p>
        </>
      )}
      <h3>Staff</h3>
      {s.staff.length > 0 ? (
        <p>
          {s.staff.join(', ')}
          <span class="muted"> · {staffNudgesPerSecond(s).toFixed(2)} nudges/s</span>
        </p>
      ) : (
        <p class="muted">Nobody yet. It is just you.</p>
      )}
      <button class="buy" disabled={!canHire(s)} onClick={() => act(hire)}>
        <span>Hire a miljøarbeider</span>
        <span class="price">
          {canAffordWage(s)
            ? `${hireCost(s)} kr · ${STAFF_WAGE_PER_WEEK} kr/week`
            : 'no room in the budget'}
        </span>
      </button>

      {shop.length > 0 && (
        <>
          <h3>Requests</h3>
          {shop.map((u) => (
            <button
              class="buy"
              disabled={!canBuy(s, u.id)}
              onClick={() => act((g) => buyUpgrade(g, u.id))}
            >
              <span>
                {u.label}
                <span class="effect">{u.effect}</span>
              </span>
              <span class="price">{u.cost} kr</span>
            </button>
          ))}
        </>
      )}

      <h3>Coach</h3>
      <div class="coach">
        {COACH_STEPS.map((u) => {
          const step = u.coachStep!;
          const cost = trainCost(step - 1);
          const name = step === 3 ? 'independent' : `lvl ${step}`;
          if (s.upgrades.includes(u.id)) {
            const on = !s.coachOff.includes(step);
            return (
              <button
                class={on ? 'step on' : 'step'}
                aria-pressed={on}
                onClick={() => act((g) => toggleCoachStep(g, step))}
              >
                <span>{name}</span>
                <span class="price overskudd-cost" title={`${cost} overskudd`}>
                  {cost}
                </span>
              </button>
            );
          }
          return (
            <button
              class="step buy-step"
              disabled={!canBuy(s, u.id)}
              onClick={() => act((g) => buyUpgrade(g, u.id))}
            >
              <span>{name}</span>
              <span class="price">{offered(s, u.id) ? `${u.cost} kr` : 'locked'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
