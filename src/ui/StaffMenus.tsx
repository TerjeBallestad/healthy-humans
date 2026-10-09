import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { ACTIVITIES } from '../content/activities';
import { NEED_ORDER, type NeedId } from '../content/needs';
import {
  ROLES,
  SPECIALITY_FILL,
  SPECIALITY_LABEL,
  SPECIALITY_TRAIN_COST,
  type StaffRole,
} from '../content/staff';
import { MAX_SKILL } from '../content/tuning';
import { canAffordWage, omsorgCap } from '../sim/institution';
import {
  canHire,
  canTrainCoach,
  canTrainSpeciality,
  coachTrainCost,
  hire,
  trainCoach,
  trainSpeciality,
  turnDown,
} from '../sim/staff';
import type { Staff } from '../sim/state';
import { act, useGame } from '../store';
import { closeModal, modal } from './modal';

/** The activities a speciality covers, in plain words. */
const covers = (need: NeedId) =>
  ACTIVITIES.filter((a) => a.trigger === need)
    .map((a) => a.label)
    .join(', ');

const levelText = (level: number) =>
  level >= MAX_SKILL ? 'independent' : level > 0 ? `lvl ${level}` : '–';

/** Name, role, face and a table of stats. Rows can hold a train button. */
function Profile({ x, train }: { x: Staff; train?: (row: string) => ComponentChildren }) {
  return (
    <div class="profile">
      <div class="profile-head">
        <strong>{x.name}</strong>
        <RoleTag role={x.role} />
      </div>
      <div class="profile-body">
        <span class="portrait" aria-hidden="true">
          {x.face}
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
                      <td class="value">
                        {has ? (
                          <Explain
                            cls="speciality"
                            label={`×${SPECIALITY_FILL}`}
                            text={`${x.name} works on ${SPECIALITY_LABEL[n].toLowerCase()} first, and does ${SPECIALITY_LABEL[n].toLowerCase()} activities at ${SPECIALITY_FILL}× speed.`}
                          />
                        ) : (
                          '×1'
                        )}
                      </td>
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

/** A button that shows a short explanation on hover, or on click until focus moves. */
function Explain({ label, cls, text }: { label: ComponentChildren; cls: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span class={open ? 'explain open' : 'explain'}>
      <button
        class={cls}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
      >
        {label}
      </button>
      <span class="popover" role="tooltip">
        {text}
      </span>
    </span>
  );
}

/** The job title. Hover or click shows what the role does. */
function RoleTag({ role }: { role: StaffRole }) {
  const r = ROLES[role];
  return (
    <Explain
      cls="role-tag"
      text={r.does}
      label={
        <>
          <span aria-hidden="true">{r.icon}</span> {r.label}
        </>
      }
    />
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
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div class="dialog hire" role="dialog" aria-modal="true" aria-label="Hire">
        <header>
          <h2>Pick one</h2>
          <button class="close" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </header>
        <div class="candidates">
          {s.candidates.map((c, i) => (
            <article class="candidate">
              <Profile x={c} />
              <div class="hire-foot">
                <span class={canAffordWage(s, c.role) ? 'wage' : 'wage short'}>
                  {ROLES[c.role].wage} kr/week
                </span>
                <button
                  class="buy-request"
                  disabled={!canHire(s, i)}
                  onClick={() => {
                    act((g) => hire(g, i));
                    closeModal();
                  }}
                >
                  Hire
                </button>
              </div>
            </article>
          ))}
        </div>
        <button
          class="choice quiet turn-down"
          onClick={() => {
            act(turnDown);
            closeModal();
          }}
        >
          Turn them all down
        </button>
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
