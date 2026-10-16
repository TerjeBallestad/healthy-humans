import { MAX_STAFF, ROLES } from '../content/staff';
import { TIERS } from '../content/tiers';
import { taxPerWeek } from '../sim/discharge';
import { hireCost, staffNudgesPerSecond } from '../sim/institution';
import { isSeen } from '../sim/reveal';
import { canPostAd, coursesReady } from '../sim/staff';
import { TICKS_PER_WEEK } from '../sim/time';
import { openModal } from './modal';
import { affordableRequests } from './RequestsMenu';
import { StaffSummary } from './StaffMenus';
import { useGame } from '../store';
import { INSTITUTION, UNITS } from '../content/text';

export function InstitutionPanel() {
  const s = useGame();
  const affordable = affordableRequests(s);
  const courses = s.staff.reduce((n, _, i) => n + coursesReady(s, i), 0);
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
      <div class="staff-list">
        {s.staff.map((x, i) => (
          <button class="staff-chip" onClick={() => openModal({ kind: 'staff', index: i })}>
            <span aria-hidden="true">{ROLES[x.role].icon}</span>
            <span class="name">{x.name}</span>
            <StaffSummary x={x} />
          </button>
        ))}
        {Array.from({ length: Math.max(0, MAX_STAFF - s.staff.length) }, (_, k) =>
          k > 0 ? (
            <span class="office empty" aria-hidden="true" />
          ) : s.candidates.length > 0 ? (
            <button class="buy office" onClick={() => openModal({ kind: 'hire' })}>
              <span>{INSTITUTION.pickCandidate}</span>
              <span class="badge">{s.candidates.length}</span>
            </button>
          ) : s.adReady !== null ? (
            <button class="buy office" disabled>
              <span>
                {s.adRole && <span aria-hidden="true">{ROLES[s.adRole].icon} </span>}
                {INSTITUTION.deadline}
              </span>
              <span class="price">{INSTITUTION.days(daysLeft)}</span>
            </button>
          ) : (
            <button
              class="buy office"
              data-tip="hire"
              disabled={!canPostAd(s)}
              onClick={() => openModal({ kind: 'post' })}
            >
              <span>{INSTITUTION.hire}</span>
              <span class="price">{UNITS.kr(hireCost(s))}</span>
            </button>
          ),
        )}
      </div>
      {staffNudgesPerSecond(s) > 0 && (
        <p class="muted hint">{INSTITUTION.nudgesInAll(staffNudgesPerSecond(s).toFixed(2))}</p>
      )}
      {s.staff.length > 0 && (
        <button
          class="buy requests-open"
          onClick={() =>
            // Open on the first staff member with a course ready.
            openModal({
              kind: 'training',
              index: Math.max(
                0,
                s.staff.findIndex((_, i) => coursesReady(s, i) > 0),
              ),
            })
          }
        >
          <span>{INSTITUTION.training}</span>
          {courses > 0 && <span class="badge">{courses}</span>}
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
