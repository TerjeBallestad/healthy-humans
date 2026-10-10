import { ACTIVITY_BY_ID } from '../content/activities';
import { GRANT_PER_BED, MAX_BEDS, NEED_THRESHOLD } from '../content/tuning';
import { buyBed, canTrain } from '../sim/actions';
import { bestTier } from '../sim/discharge';
import { bedCost, canBuyBed, grantMult } from '../sim/institution';
import { activeNeeds, unlockedActivities } from '../sim/selectors';
import { act, useGame } from '../store';

/** One small card per bed. Click a card to look at that bed. */
export function ResidentStrip() {
  const s = useGame();
  return (
    <nav class="strip">
      {s.beds.map((r, i) => (
        <button
          class={i === s.selected ? 'bed selected' : 'bed'}
          aria-pressed={i === s.selected}
          onClick={() => act((g) => (g.selected = i))}
        >
          {r ? (
            <>
              {unlockedActivities(r).some((a) => canTrain(s, i, a.id)) && (
                <span class="skill-pip" title="A skill-up is ready" />
              )}
              <span class="name">
                {r.name}
                {bestTier(r) && <span class="tag">discharge</span>}
              </span>
              <span class="now" aria-hidden="true">
                {r.current ? ACTIVITY_BY_ID[r.current.id].icon : ''}
              </span>
              <span class="mini">
                {activeNeeds(r).map((n) => (
                  <span class={r.needs[n] < NEED_THRESHOLD ? 'bar low' : 'bar'}>
                    <span class="fill" style={{ height: `${r.needs[n]}%` }} />
                  </span>
                ))}
              </span>
            </>
          ) : (
            <span class="name muted">Empty bed</span>
          )}
        </button>
      ))}
      {s.beds.length < MAX_BEDS && (
        <button class="bed buy-bed" disabled={!canBuyBed(s)} onClick={() => act(buyBed)}>
          <span class="name">+ Bed</span>
          <span class="price">{bedCost(s)} kr</span>
          <span class="muted">+{GRANT_PER_BED * grantMult(s)} kr/w</span>
        </button>
      )}
    </nav>
  );
}
