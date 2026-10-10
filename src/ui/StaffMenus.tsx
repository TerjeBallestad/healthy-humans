import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ACTIVITIES, ACTIVITY_BY_ID, type ActivityId } from '../content/activities';
import { NEED_ORDER, type NeedId } from '../content/needs';
import {
  MESTRING_BONUS,
  MESTRING_TRAIN_COST,
  ROLES,
  SPECIALITY_FILL,
  SPECIALITY_ICON,
  SPECIALITY_LABEL,
  SPECIALITY_TRAIN_COST,
  type StaffRole,
} from '../content/staff';
import { MAX_SKILL } from '../content/tuning';
import { canAffordWage, omsorgCap } from '../sim/institution';
import {
  canHire,
  canTrainCoach,
  canTrainMestring,
  canTrainSpeciality,
  coachTrainCost,
  hire,
  trainCoach,
  trainMestring,
  trainSpeciality,
  turnDown,
} from '../sim/staff';
import type { Staff } from '../sim/state';
import { act, useGame } from '../store';
import { closeModal, modal, openModal } from './modal';

/** The activities a speciality covers, in plain words. */
const covers = (need: NeedId) =>
  ACTIVITIES.filter((a) => a.trigger === need)
    .map((a) => a.label)
    .join(', ');

const levelText = (level: number) =>
  level >= MAX_SKILL ? 'independent' : level > 0 ? `lvl ${level}` : '–';

/** Name, role, face and a table of stats. */
function Profile({ x }: { x: Staff }) {
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
                {ACTIVITIES.filter((a) => x.coaching[a.id]).map((a) => {
                  const level = x.coaching[a.id] ?? 0;
                  return (
                    <tr class={level > 0 ? 'strong' : ''}>
                      <td>{a.label}</td>
                      <td class="value">{levelText(level)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          )}
          {x.mestring && (
            <tfoot>
              <tr class="strong">
                <td>
                  Mestring
                  <span class="covers">Every resident</span>
                </td>
                <td class="value">+{MESTRING_BONUS * 100}% overskudd</td>
              </tr>
            </tfoot>
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
  // Open by itself once per batch of candidates, when nothing else is open.
  const shown = useRef(false);
  const ready = s.candidates.length > 0;
  useEffect(() => {
    if (!ready) shown.current = false;
    else if (!shown.current && !modal.value && !s.proposal && !s.discharge) {
      shown.current = true;
      openModal({ kind: 'hire' });
    }
  });
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
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div class="dialog staff-card" role="dialog" aria-modal="true" aria-label={x.name}>
        <header>
          <span class="muted">{ROLES[x.role].wage} kr/week</span>
          <button class="close" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </header>
        <Profile x={x} />
        <button
          class="buy-request wide"
          onClick={() => openModal({ kind: 'training', index: m.index })}
        >
          Training →
        </button>
      </div>
    </div>
  );
}

/** Courses paid with omsorg. One tab for each staff member. */
export function TrainingMenu() {
  const s = useGame();
  const m = modal.value;
  if (m?.kind !== 'training') return null;
  const i = Math.min(m.index, s.staff.length - 1);
  const x = s.staff[i];
  if (!x) return null;
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div class="dialog requests training" role="dialog" aria-modal="true" aria-label="Training">
        <header>
          <nav class="tabs" role="tablist">
            {s.staff.map((y, j) => (
              <button
                role="tab"
                aria-selected={j === i}
                class={j === i ? 'tab on' : 'tab'}
                onClick={() => (modal.value = { kind: 'training', index: j })}
              >
                <span aria-hidden="true">{y.face}</span>
                {y.name}
              </button>
            ))}
          </nav>
          <span class="omsorg-left">
            Omsorg <strong>{Math.floor(s.omsorg)}</strong>
            <span class="muted">/{omsorgCap(s)}</span>
          </span>
          <button class="close" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </header>
        <p class="training-who">
          <RoleTag role={x.role} />
        </p>
        <div class="lines">
          <Course
            icon="🌱"
            title="Mestring course"
            effect={`Every resident: overskudd +${MESTRING_BONUS * 100}%`}
            done={!!x.mestring}
            cost={MESTRING_TRAIN_COST}
            can={canTrainMestring(s, i)}
            onTrain={() => act((g) => trainMestring(g, i))}
          />
          {x.role === 'worker'
            ? NEED_ORDER.map((n) => <SpecialityCourse i={i} x={x} need={n} />)
            : ACTIVITIES.map((a) => <CoachCourse i={i} x={x} id={a.id} />)}
        </div>
      </div>
    </div>
  );
}

function SpecialityCourse({ i, x, need }: { i: number; x: Staff; need: NeedId }) {
  const s = useGame();
  const has = x.specialities.includes(need);
  return (
    <Course
      icon={SPECIALITY_ICON[need]}
      title={`${SPECIALITY_LABEL[need]} course`}
      effect={`${covers(need)}: ×${SPECIALITY_FILL} nudge, and first in line`}
      done={has}
      cost={SPECIALITY_TRAIN_COST}
      can={canTrainSpeciality(s, i, need)}
      onTrain={() => act((g) => trainSpeciality(g, i, need))}
    />
  );
}

function CoachCourse({ i, x, id }: { i: number; x: Staff; id: ActivityId }) {
  const s = useGame();
  const a = ACTIVITY_BY_ID[id];
  const level = x.coaching[id] ?? 0;
  const done = level >= MAX_SKILL;
  return (
    <Course
      icon={a.icon}
      title={`Teach ${a.label.toLowerCase()}`}
      effect={done ? 'Up to independent' : `Up to ${levelText(level + 1)}`}
      level={level}
      done={done}
      cost={coachTrainCost(x, id)}
      can={canTrainCoach(s, i, id)}
      onTrain={() => act((g) => trainCoach(g, i, id))}
    />
  );
}

/** One course, in the shape of an upgrade card. */
function Course(p: {
  icon: string;
  title: string;
  effect: string;
  level?: number;
  done: boolean;
  cost: number;
  can: boolean;
  onTrain: () => void;
}) {
  return (
    <article class={p.done ? 'request done' : 'request'}>
      <span class="icon" aria-hidden="true">
        {p.icon}
      </span>
      <div class="text">
        <strong class="title">{p.title}</strong>
        <span class="effect">{p.effect}</span>
        {p.level !== undefined && (
          <span class="pips" aria-label={`Level ${p.level} of ${MAX_SKILL}`}>
            {Array.from({ length: MAX_SKILL }, (_, k) => (
              <span class={k < p.level! ? 'pip on' : 'pip'} />
            ))}
          </span>
        )}
      </div>
      <div class="buy-col">
        {p.done ? (
          <span class="tick" aria-label="Done">
            ✓
          </span>
        ) : (
          <>
            <span class="price">{p.cost} omsorg</span>
            <button class="buy-request" disabled={!p.can} onClick={p.onTrain}>
              Train
            </button>
          </>
        )}
      </div>
    </article>
  );
}
