import { NEEDS } from '../content/needs';
import { MILESTONE_BY_ID } from '../content/milestones';
import { MAX_SKILL, NEED_THRESHOLD, OVERSKUDD_CAP } from '../content/tuning';
import { bestTier, nextTier, openDischarge } from '../sim/discharge';
import { activeNeeds, statusLine, unlockedActivities } from '../sim/selectors';
import { act, useGame } from '../store';
import { NudgeBar } from './NudgeBar';

export function ResidentPanel() {
  const s = useGame();
  const r = s.resident;
  const open = unlockedActivities(r);
  const alone = open.filter((a) => r.skill[a.id] >= MAX_SKILL);
  const learning = open.filter((a) => r.skill[a.id] < MAX_SKILL);
  const best = bestTier(r);
  const better = nextTier(r);
  const growing = activeNeeds(r).every((n) => r.needs[n] >= NEED_THRESHOLD);
  return (
    <section class="resident">
      <h2>{r.name}</h2>
      <p class="muted intro">{r.intro}</p>
      <p class="status">{statusLine(r)}</p>

      <ul class="needs">
        {activeNeeds(r).map((id) => {
          const value = r.needs[id];
          const low = value < NEED_THRESHOLD;
          return (
            <li class={low ? 'need low' : 'need'}>
              <span class="label">{NEEDS[id].label}</span>
              <div class="meter">
                <div class="fill" style={{ width: `${value}%` }} />
              </div>
              <span class="state">{low ? NEEDS[id].lowState : ''}</span>
            </li>
          );
        })}
      </ul>

      <div class="overskudd">
        <span class="label">Overskudd</span>
        <div class="meter">
          <div class="fill" style={{ width: `${(r.overskudd / OVERSKUDD_CAP) * 100}%` }} />
        </div>
        <span class="state">{growing ? '' : 'not growing while a need is low'}</span>
      </div>

      <div class="nudges">
        {learning.map((a) => (
          <NudgeBar activity={a} />
        ))}
      </div>

      {alone.length > 0 && (
        <p class="alone">
          <span class="muted">Handles alone: </span>
          {alone.map((a, i) => (
            <span class={r.current?.id === a.id ? 'doing' : ''}>
              {i > 0 ? ', ' : ''}
              {a.noun}
            </span>
          ))}
        </p>
      )}

      {r.milestones.length > 0 && (
        <p class="alone">
          <span class="muted">Milestones: </span>
          {r.milestones.map((id) => MILESTONE_BY_ID[id].label).join(', ')}
        </p>
      )}

      <div class="discharge">
        {best && (
          <button class="buy" onClick={() => act(openDischarge)}>
            <span>Discharge: {best.label.toLowerCase()}</span>
            <span class="price">+{best.taxPerDay} kr/day</span>
          </button>
        )}
        {better && (
          <p class="muted hint">
            {better.label} (+{better.taxPerDay} kr/day) needs {better.needs}.
          </p>
        )}
      </div>
    </section>
  );
}
