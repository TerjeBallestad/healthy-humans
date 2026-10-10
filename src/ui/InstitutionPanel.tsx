import { ROLES } from '../content/staff';
import { TIERS } from '../content/tiers';
import { taxPerWeek } from '../sim/discharge';
import { hireCost, staffNudgesPerSecond } from '../sim/institution';
import { isSeen } from '../sim/reveal';
import { canPostAd, postAd } from '../sim/staff';
import { TICKS_PER_WEEK } from '../sim/time';
import { openModal } from './modal';
import { affordableRequests } from './RequestsMenu';
import { StaffSummary } from './StaffMenus';
import { act, useGame } from '../store';
import { INSTITUTION, UNITS } from '../content/text';

export function InstitutionPanel() {
  const s = useGame();
  const affordable = affordableRequests(s);
  const daysLeft = s.adReady === null ? 0 : Math.ceil(((s.adReady - s.tick) / TICKS_PER_WEEK) * 7);
  if (!isSeen(s, 'staff')) return null;
  return (
    <section class="panel institution">
      {s.discharged.length > 0 && (
        <>
          <h3>{INSTITUTION.discharged}</h3>
          <ul class="discharged">
            {[...TIERS].reverse().map((t) => {
              const n = s.discharged.filter((d) => d.tier === t.id).length;
              return (
                n > 0 && (
                  <li>
                    <span>{t.label}</span>
                    <span class="count">{n}</span>
                  </li>
                )
              );
            })}
            <li class="muted">
              <span>{INSTITUTION.tax}</span>
              <span class="count">{UNITS.plusKrPerW(taxPerWeek(s))}</span>
            </li>
          </ul>
        </>
      )}
      <h3>{INSTITUTION.staff}</h3>
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
        <p class="muted">{INSTITUTION.nobody}</p>
      )}
      {staffNudgesPerSecond(s) > 0 && (
        <p class="muted hint">{INSTITUTION.nudgesInAll(staffNudgesPerSecond(s).toFixed(2))}</p>
      )}
      {s.candidates.length > 0 ? (
        <button class="buy" onClick={() => openModal({ kind: 'hire' })}>
          <span>{INSTITUTION.pickCandidate}</span>
          <span class="badge">{s.candidates.length}</span>
        </button>
      ) : s.adReady !== null ? (
        <button class="buy" disabled>
          <span>{INSTITUTION.deadline}</span>
          <span class="price">{INSTITUTION.days(daysLeft)}</span>
        </button>
      ) : (
        <button class="buy" data-tip="hire" disabled={!canPostAd(s)} onClick={() => act(postAd)}>
          <span>{INSTITUTION.hire}</span>
          <span class="price">{UNITS.kr(hireCost(s))}</span>
        </button>
      )}
      {s.staff.length > 0 && (
        <button class="buy requests-open" onClick={() => openModal({ kind: 'training', index: 0 })}>
          <span>{INSTITUTION.training}</span>
        </button>
      )}
      {isSeen(s, 'upgrades') && (
        <button
          class="buy requests-open"
          data-tip="upgrades"
          onClick={() => openModal({ kind: 'requests' })}
        >
          <span>{INSTITUTION.upgrades}</span>
          {affordable > 0 && <span class="badge">{affordable}</span>}
        </button>
      )}
    </section>
  );
}
