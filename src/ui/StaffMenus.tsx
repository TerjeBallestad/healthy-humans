import { ACTIVITIES } from '../content/activities';
import { NEED_ORDER } from '../content/needs';
import {
  CANDIDATE_WEEKS,
  ROLES,
  SPECIALITY_FILL,
  SPECIALITY_LABEL,
  SPECIALITY_TRAIN_COST,
} from '../content/staff';
import { MAX_SKILL } from '../content/tuning';
import { canAffordWage, hireCost, omsorgCap, workerNudgesPerSecond } from '../sim/institution';
import {
  canHire,
  canTrainCoach,
  canTrainSpeciality,
  coachTrainCost,
  hire,
  trainCoach,
  trainSpeciality,
} from '../sim/staff';
import type { Staff } from '../sim/state';
import { TICKS_PER_WEEK } from '../sim/time';
import { act, useGame } from '../store';
import { closeModal, modal } from './modal';

/** What a staff member can do, in one line: specialities, or the levels a coach can teach. */
export function SheetLine({ x }: { x: Staff }) {
  if (x.role === 'worker')
    return <span class="sheet">{x.specialities.map((n) => SPECIALITY_LABEL[n]).join(', ')}</span>;
  return (
    <span class="sheet">
      {ACTIVITIES.filter((a) => x.coaching[a.id]).map((a) => (
        <span class="skill" title={`${a.label}: up to lvl ${x.coaching[a.id]}`}>
          {a.icon}
          <span class="dots">{'●'.repeat(x.coaching[a.id]!)}</span>
        </span>
      ))}
    </span>
  );
}

export function HireMenu() {
  const s = useGame();
  if (modal.value?.kind !== 'hire') return null;
  const period = CANDIDATE_WEEKS * TICKS_PER_WEEK;
  const weeks = Math.ceil((period - (s.tick % period)) / TICKS_PER_WEEK);
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div class="dialog requests" role="dialog" aria-modal="true" aria-label="Hire">
        <header>
          <h2>Candidates</h2>
          <button class="close" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </header>
        <div class="lines">
          {s.candidates.length === 0 && <p class="muted">Nobody else has applied.</p>}
          {s.candidates.map((c, i) => (
            <article class="request">
              <span class="icon" aria-hidden="true">
                {ROLES[c.role].icon}
              </span>
              <div class="text">
                <strong class="title">
                  {c.name} <span class="muted role">{ROLES[c.role].label}</span>
                </strong>
                <span class="effect">
                  <SheetLine x={c} />
                </span>
                <span class={canAffordWage(s, c.role) ? 'wage' : 'wage short'}>
                  {ROLES[c.role].wage} kr/week
                </span>
              </div>
              <div class="buy-col">
                <span class="price">{hireCost(s)} kr</span>
                <button
                  class="buy-request"
                  disabled={!canHire(s, i)}
                  onClick={() => act((g) => hire(g, i))}
                >
                  Hire
                </button>
              </div>
            </article>
          ))}
        </div>
        <p class="muted hint">
          New candidates in {weeks} {weeks === 1 ? 'week' : 'weeks'}.
        </p>
      </div>
    </div>
  );
}

export function StaffCard() {
  const s = useGame();
  const m = modal.value;
  if (m?.kind !== 'staff') return null;
  const x = s.staff[m.index];
  if (!x) return null;
  const role = ROLES[x.role];
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div class="dialog requests staff-card" role="dialog" aria-modal="true" aria-label={x.name}>
        <header>
          <div class="who">
            <span class="icon" aria-hidden="true">
              {role.icon}
            </span>
            <div>
              <h2>{x.name}</h2>
              <span class="muted">
                {role.label} · {role.wage} kr/week
              </span>
            </div>
          </div>
          <span class="omsorg-left">
            Omsorg <strong>{Math.floor(s.omsorg)}</strong>
            <span class="muted"> / {omsorgCap(s)}</span>
          </span>
          <button class="close" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </header>

        {x.role === 'worker' && (
          <>
            <p class="muted">
              {workerNudgesPerSecond(s).toFixed(2)} nudges/s. Specialities come first and fill{' '}
              {SPECIALITY_FILL} segments.
            </p>
            <ul class="train-list">
              {NEED_ORDER.map((n) => {
                const has = x.specialities.includes(n);
                return (
                  <li class={has ? 'has' : ''}>
                    <span>{SPECIALITY_LABEL[n]}</span>
                    <span />
                    {has ? (
                      <span class="tick">✓</span>
                    ) : (
                      <button
                        class="buy-request"
                        disabled={!canTrainSpeciality(s, m.index, n)}
                        onClick={() => act((g) => trainSpeciality(g, m.index, n))}
                      >
                        {SPECIALITY_TRAIN_COST} omsorg
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {x.role === 'coach' && (
          <ul class="train-list">
            {ACTIVITIES.map((a) => {
              const level = x.coaching[a.id] ?? 0;
              return (
                <li class={level > 0 ? 'has' : ''}>
                  <span>
                    <span aria-hidden="true">{a.icon}</span> {a.label}
                  </span>
                  <span class="pips" aria-label={`Up to lvl ${level}`}>
                    {Array.from({ length: MAX_SKILL }, (_, i) => (
                      <span class={i < level ? 'pip on' : 'pip'} />
                    ))}
                  </span>
                  {level >= MAX_SKILL ? (
                    <span class="tick">✓</span>
                  ) : (
                    <button
                      class="buy-request"
                      disabled={!canTrainCoach(s, m.index, a.id)}
                      onClick={() => act((g) => trainCoach(g, m.index, a.id))}
                    >
                      {coachTrainCost(x, a.id)} omsorg
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
