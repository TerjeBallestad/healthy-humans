import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { ACTIVITIES } from '../content/activities';
import { NEED_ORDER, type NeedId } from '../content/needs';
import {
  CANDIDATE_WEEKS,
  ROLES,
  SPECIALITY_FILL,
  SPECIALITY_LABEL,
  SPECIALITY_TRAIN_COST,
  type StaffRole,
} from '../content/staff';
import { MAX_SKILL } from '../content/tuning';
import { canAffordWage, hireCost, omsorgCap } from '../sim/institution';
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

/** The activities a speciality covers, in plain words. */
const covers = (need: NeedId) =>
  ACTIVITIES.filter((a) => a.trigger === need)
    .map((a) => a.label)
    .join(', ');

const levelText = (level: number) =>
  level >= MAX_SKILL ? 'independent' : level > 0 ? `lvl ${level}` : '–';

/** Name, portrait, what the role does and a table of stats. Rows can hold a train button. */
function Profile({ x, train }: { x: Staff; train?: (row: string) => ComponentChildren }) {
  const role = ROLES[x.role];
  return (
    <div class="profile">
      <div class="profile-head">
        <strong>{x.name}</strong>
        <RoleTag role={x.role} />
      </div>
      <div class="profile-body">
        <span class="portrait" aria-hidden="true">
          {role.icon}
        </span>
        <table class="stats">
          {x.role === 'worker' ? (
            <>
              <thead>
                <tr>
                  <th />
                  <th>Nudge</th>
                </tr>
              </thead>
              <tbody>
                {NEED_ORDER.map((n) => {
                  const has = x.specialities.includes(n);
                  return (
                    <tr class={has ? 'strong' : ''}>
                      <td>
                        {SPECIALITY_LABEL[n]}
                        <span class="covers">{covers(n)}</span>
                      </td>
                      <td class="value">×{has ? SPECIALITY_FILL : 1}</td>
                      {train && <td>{train(n)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th />
                  <th>Trains to</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITIES.filter((a) => train || x.coaching[a.id]).map((a) => {
                  const level = x.coaching[a.id] ?? 0;
                  return (
                    <tr class={level > 0 ? 'strong' : ''}>
                      <td>{a.label}</td>
                      <td class="value">{levelText(level)}</td>
                      {train && <td>{train(a.id)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );
}

/** The job title as a small button. Hover or click shows what the role does. */
function RoleTag({ role }: { role: StaffRole }) {
  const [open, setOpen] = useState(false);
  const r = ROLES[role];
  return (
    <span class={open ? 'role open' : 'role'}>
      <button
        class="role-tag"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
      >
        <span aria-hidden="true">{r.icon}</span> {r.label}
      </button>
      <span class="popover" role="tooltip">
        {r.does}
      </span>
    </span>
  );
}

/** One short line for the staff panel. */
export function StaffSummary({ x }: { x: Staff }) {
  if (x.role === 'worker')
    return (
      <span class="sheet">
        {ROLES.worker.label} · {x.specialities.map((n) => SPECIALITY_LABEL[n]).join(', ')}
      </span>
    );
  const n = Object.values(x.coaching).filter(Boolean).length;
  return (
    <span class="sheet">
      {ROLES.coach.label} · {n} {n === 1 ? 'activity' : 'activities'}
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
      <div class="dialog hire" role="dialog" aria-modal="true" aria-label="Hire">
        <header>
          <h2>Candidates</h2>
          <button class="close" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </header>
        {s.candidates.length === 0 && <p class="muted">Nobody else has applied.</p>}
        <div class="candidates">
          {s.candidates.map((c, i) => (
            <article class="candidate">
              <Profile x={c} />
              <div class="hire-foot">
                <span class={canAffordWage(s, c.role) ? 'wage' : 'wage short'}>
                  {ROLES[c.role].wage} kr/week
                </span>
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
  const i = m.index;

  const trainWorker = (need: string) => {
    const n = need as NeedId;
    if (x.specialities.includes(n)) return null;
    return (
      <button
        class="buy-request"
        disabled={!canTrainSpeciality(s, i, n)}
        onClick={() => act((g) => trainSpeciality(g, i, n))}
      >
        {SPECIALITY_TRAIN_COST} omsorg
      </button>
    );
  };
  const trainCoachRow = (id: string) => {
    const a = ACTIVITIES.find((y) => y.id === id)!;
    if ((x.coaching[a.id] ?? 0) >= MAX_SKILL) return null;
    return (
      <button
        class="buy-request"
        disabled={!canTrainCoach(s, i, a.id)}
        onClick={() => act((g) => trainCoach(g, i, a.id))}
      >
        {coachTrainCost(x, a.id)} omsorg
      </button>
    );
  };

  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div class="dialog staff-card" role="dialog" aria-modal="true" aria-label={x.name}>
        <header>
          <span class="omsorg-left">
            Omsorg <strong>{Math.floor(s.omsorg)}</strong>
            <span class="muted"> / {omsorgCap(s)}</span>
          </span>
          <span class="muted">{ROLES[x.role].wage} kr/week</span>
          <button class="close" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </header>
        <Profile x={x} train={x.role === 'worker' ? trainWorker : trainCoachRow} />
      </div>
    </div>
  );
}
