import { ROLES } from '../content/staff';
import { TIER_BY_ID } from '../content/tiers';
import { taxPerWeek } from '../sim/discharge';
import { hireCost, staffNudgesPerSecond } from '../sim/institution';
import { canPostAd, postAd } from '../sim/staff';
import { TICKS_PER_WEEK } from '../sim/time';
import { openModal } from './modal';
import { affordableRequests } from './RequestsMenu';
import { StaffSummary } from './StaffMenus';
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
        <div class="staff-list">
          {s.staff.map((x, i) => (
            <button class="staff-chip" onClick={() => openModal({ kind: 'staff', index: i })}>
              <span aria-hidden="true">{ROLES[x.role].icon}</span>
              <span class="name">{x.name}</span>
              <StaffSummary x={x} />
            </button>
          ))}
        </div>
      ) : (
        <p class="muted">Nobody yet. It is just you.</p>
      )}
      {staffNudgesPerSecond(s) > 0 && (
        <p class="muted hint">{staffNudgesPerSecond(s).toFixed(2)} nudges/s in all</p>
      )}
      {s.candidates.length > 0 ? (
        <button class="buy" onClick={() => openModal({ kind: 'hire' })}>
          <span>Pick a candidate</span>
          <span class="badge">{s.candidates.length}</span>
        </button>
      ) : s.adReady !== null ? (
        <button class="buy" disabled>
          <span>Job ad is out</span>
          <span class="price">{((s.adReady - s.tick) / TICKS_PER_WEEK).toFixed(1)} weeks</span>
        </button>
      ) : (
        <button class="buy" disabled={!canPostAd(s)} onClick={() => act(postAd)}>
          <span>Hire</span>
          <span class="price">{hireCost(s)} kr</span>
        </button>
      )}
      <button class="buy requests-open" onClick={() => openModal({ kind: 'requests' })}>
        <span>Requests</span>
        {affordable > 0 && <span class="badge">{affordable}</span>}
      </button>
    </section>
  );
}
