import { STAFF_WAGE_PER_WEEK } from '../content/tuning';
import { TIER_BY_ID } from '../content/tiers';
import { hire } from '../sim/actions';
import { taxPerWeek } from '../sim/discharge';
import { canAffordWage, canHire, hireCost, staffNudgesPerSecond } from '../sim/institution';
import { affordableRequests, openRequests } from './RequestsMenu';
import { act, useGame } from '../store';

export function InstitutionPanel() {
  const s = useGame();
  const affordable = affordableRequests(s);
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

      <button class="buy requests-open" onClick={openRequests}>
        <span>Requests</span>
        {affordable > 0 && <span class="badge">{affordable}</span>}
      </button>
    </section>
  );
}
