import { STAFF_WAGE_PER_DAY } from '../content/tuning';
import { TIER_BY_ID } from '../content/tiers';
import { UPGRADES } from '../content/upgrades';
import { buyUpgrade, hire } from '../sim/actions';
import { taxPerDay } from '../sim/discharge';
import { canAffordWage, canBuy, canHire, hireCost } from '../sim/institution';
import { act, useGame } from '../store';

export function InstitutionPanel() {
  const s = useGame();
  const shop = UPGRADES.filter((u) => !s.upgrades.includes(u.id));
  return (
    <section class="panel institution">
      {s.discharged.length > 0 && (
        <>
          <h3>Discharged</h3>
          <p>
            {s.discharged
              .map((d) => `${d.name} (${TIER_BY_ID[d.tier].label.toLowerCase()})`)
              .join(', ')}
            <span class="muted"> · +{taxPerDay(s)} kr/day in tax</span>
          </p>
        </>
      )}
      <h3>Staff</h3>
      {s.staff.length > 0 ? (
        <p>{s.staff.join(', ')}</p>
      ) : (
        <p class="muted">Nobody yet. It is just you.</p>
      )}
      <button class="buy" disabled={!canHire(s)} onClick={() => act(hire)}>
        <span>Hire a miljøarbeider</span>
        <span class="price">
          {canAffordWage(s)
            ? `${hireCost(s)} kr · ${STAFF_WAGE_PER_DAY} kr/day`
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
                <span class="effect">
                  {u.capAdd ? `+${u.capAdd} omsorg cap` : ''}
                  {u.rateMult ? `+${Math.round((u.rateMult - 1) * 100)}% omsorg` : ''}
                </span>
              </span>
              <span class="price">{u.cost} kr</span>
            </button>
          ))}
        </>
      )}
    </section>
  );
}
