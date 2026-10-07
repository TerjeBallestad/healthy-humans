import { NEEDS } from '../content/needs';
import { MAX_SKILL, NEED_THRESHOLD } from '../content/tuning';
import { activeNeeds, statusLine, unlockedActivities } from '../sim/selectors';
import { useGame } from '../store';
import { NudgeBar } from './NudgeBar';

export function ResidentPanel() {
  const s = useGame();
  const r = s.resident;
  const open = unlockedActivities(r);
  const alone = open.filter((a) => r.skill[a.id] >= MAX_SKILL);
  const learning = open.filter((a) => r.skill[a.id] < MAX_SKILL).reverse();
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
    </section>
  );
}
