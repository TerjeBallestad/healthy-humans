import { NEEDS } from '../content/needs';
import { MILESTONE_BY_ID } from '../content/milestones';
import { TRAIT_BY_ID } from '../content/traits';
import { NEED_THRESHOLD, OVERSKUDD_CAP } from '../content/tuning';
import { bestTier, nextTier, openDischarge, tierMissing, tierTax } from '../sim/discharge';
import { isSeen } from '../sim/reveal';
import { activeNeeds, statusLine } from '../sim/selectors';
import { selectedResident } from '../sim/state';
import { act, useGame } from '../store';
import { RESIDENT, UNITS } from '../content/text';

export function ResidentPanel() {
  const s = useGame();
  const r = selectedResident(s);
  if (!r)
    return (
      <section class="panel resident">
        <h2>{RESIDENT.emptyBed}</h2>
      </section>
    );
  const best = bestTier(r);
  const better = nextTier(r);
  const needs = activeNeeds(r);
  const green = needs.filter((n) => r.needs[n] >= NEED_THRESHOLD).length / needs.length;
  return (
    <section class="panel resident">
      <h2>
        {r.name}
        {r.trait && <span class="tag">{TRAIT_BY_ID[r.trait].label}</span>}
      </h2>
      <p class="muted intro">{r.intro}</p>
      {r.strain > 0.005 && (
        <p class="strain">
          {RESIDENT.strain(Math.round(r.arrivalHealth), Math.round(r.strain * 100))}
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

      {isSeen(s, 'overskudd') && (
        <div class="overskudd" data-tip="overskudd">
          <span class="label">{RESIDENT.overskudd}</span>
          <div class="meter">
            <div class="fill" style={{ width: `${(r.overskudd / OVERSKUDD_CAP) * 100}%` }} />
          </div>
          <span class="state">
            {Math.floor(r.overskudd)} / {OVERSKUDD_CAP}
            {green < 1 && RESIDENT.growing(Math.round(green * 100))}
          </span>
        </div>
      )}

      {r.milestones.length > 0 && (
        <p class="alone">
          <span class="muted">{RESIDENT.milestones}</span>
          {r.milestones.map((id) => MILESTONE_BY_ID[id].label).join(', ')}
        </p>
      )}

      <div class="discharge">
        {best && (
          <button
            class="buy"
            data-tip="discharge"
            onClick={() => act((g) => openDischarge(g, g.selected))}
          >
            <span>{RESIDENT.discharge(best.label)}</span>
            <span class="price">{UNITS.plusKrPerWeek(tierTax(r, best.id))}</span>
          </button>
        )}
        {better && (
          <p class="muted hint">
            {RESIDENT.nextTier(better.label, tierTax(r, better.id), tierMissing(r, better.id))}
          </p>
        )}
      </div>
    </section>
  );
}
