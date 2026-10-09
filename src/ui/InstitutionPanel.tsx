import { ROLES } from '../content/staff';
import { TIER_BY_ID } from '../content/tiers';
import { taxPerWeek } from '../sim/discharge';
import { staffNudgesPerSecond } from '../sim/institution';
import { canHire } from '../sim/staff';
import { openModal } from './modal';
import { affordableRequests } from './RequestsMenu';
import { StaffSummary } from './StaffMenus';
import { useGame } from '../store';

export function InstitutionPanel() {
  const s = useGame();
  const affordable = affordableRequests(s);
  const hireable = s.candidates.filter((_, i) => canHire(s, i)).length;
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
      <button class="buy" onClick={() => openModal({ kind: 'hire' })}>
        <span>Hire</span>
        {hireable > 0 && <span class="badge">{hireable}</span>}
      </button>
      <button class="buy requests-open" onClick={() => openModal({ kind: 'requests' })}>
        <span>Requests</span>
        {affordable > 0 && <span class="badge">{affordable}</span>}
      </button>
    </section>
  );
}
