import { NEEDS } from '../content/needs';
import { MILESTONE_BY_ID } from '../content/milestones';
import { NEED_THRESHOLD, OVERSKUDD_CAP } from '../content/tuning';
import { bestTier, nextTier, openDischarge } from '../sim/discharge';
import { activeNeeds, statusLine } from '../sim/selectors';
import { selectedResident } from '../sim/state';
import { act, useGame } from '../store';

export function ResidentPanel() {
  const s = useGame();
  const r = selectedResident(s);
  if (!r)
    return (
      <section class="panel resident">
        <h2>Empty bed</h2>
      </section>
    );
  const best = bestTier(r);
  const better = nextTier(r);
  const needs = activeNeeds(r);
  const green = needs.filter((n) => r.needs[n] >= NEED_THRESHOLD).length / needs.length;
  return (
    <section class="panel resident">
      <h2>{r.name}</h2>
      <p class="muted intro">{r.intro}</p>
      {r.strain > 0.005 && (
        <p class="strain">
          Waited {r.waitedWeeks} weeks for a place. Needs drop {Math.round(r.strain * 100)}% faster
          for now.
        </p>
      )}
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
        <span class="state">
          {Math.floor(r.overskudd)} / {OVERSKUDD_CAP}
          {green < 1 && ` · growing at ${Math.round(green * 100)}% while a need is low`}
        </span>
      </div>

      {r.milestones.length > 0 && (
        <p class="alone">
          <span class="muted">Milestones: </span>
          {r.milestones.map((id) => MILESTONE_BY_ID[id].label).join(', ')}
        </p>
      )}

      <div class="discharge">
        {best && (
          <button class="buy" onClick={() => act((g) => openDischarge(g, g.selected))}>
            <span>Discharge: {best.label.toLowerCase()}</span>
            <span class="price">+{best.taxPerWeek} kr/week</span>
          </button>
        )}
        {better && (
          <p class="muted hint">
            {better.label} (+{better.taxPerWeek} kr/week) needs {better.needs}.
          </p>
        )}
      </div>
    </section>
  );
}
