import { MAX_SKILL, barSize, trainCost } from '../content/tuning';
import { canTrain, train } from '../sim/actions';
import { unlockedActivities } from '../sim/selectors';
import { act, useGame } from '../store';

export function TrainingPanel() {
  const s = useGame();
  const r = s.resident;
  const learning = unlockedActivities(r).filter((a) => r.skill[a.id] < MAX_SKILL);
  if (learning.length === 0) return null;
  return (
    <section class="panel training">
      <h3>
        Training <span class="muted">· costs overskudd</span>
      </h3>
      <ul>
        {learning.map((a) => {
          const skill = r.skill[a.id];
          const next = skill + 1;
          return (
            <li>
              <span class="icon" aria-hidden="true">
                {a.icon}
              </span>
              <span class="what">
                {a.label}
                <span class="muted effect">
                  {next >= MAX_SKILL
                    ? 'becomes automatic'
                    : `${barSize(skill)} → ${barSize(next)} nudges`}
                </span>
              </span>
              <button
                class="train"
                disabled={!canTrain(s, a.id)}
                onClick={() => act((g) => train(g, a.id))}
              >
                {trainCost(skill)}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
