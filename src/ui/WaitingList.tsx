import { ARCHETYPE_BY_ID } from '../content/archetypes';
import { WAIT_NEED_FLOOR, WAITLIST_WEEKS_PER_PERSON } from '../content/tuning';
import { admit, freeBed } from '../sim/actions';
import { waitCost, waitedWeeks } from '../sim/discharge';
import { TICKS_PER_WEEK } from '../sim/time';
import { act, useGame } from '../store';

export function WaitingList() {
  const s = useGame();
  const period = WAITLIST_WEEKS_PER_PERSON * TICKS_PER_WEEK;
  const nextIn = (period - (s.tick % period)) / TICKS_PER_WEEK;
  const bedFree = freeBed(s) >= 0;
  return (
    <section class="panel waitlist">
      <h3>
        Venteliste <span class="count">{s.waiting.length}</span>
      </h3>
      {s.waiting.length === 0 && <p class="muted">Nobody is waiting.</p>}
      <ol>
        {s.waiting.map((p, i) => {
          const weeks = waitedWeeks(s, p.joined);
          const cost = waitCost(weeks);
          const left = 1 - cost.needLoss / (100 - WAIT_NEED_FLOOR);
          const level = cost.strainPct >= 20 ? 'bad' : cost.strainPct > 0 ? 'worse' : '';
          return (
            <li class={level}>
              <span class="who">
                {ARCHETYPE_BY_ID[p.archetype].name}
                <span class="muted">
                  {' '}
                  · {weeks} {weeks === 1 ? 'week' : 'weeks'}
                </span>
              </span>
              <span class="meter">
                <span class="fill" style={{ width: `${left * 100}%` }} />
              </span>
              <span class="row">
                <span class="cost">
                  {weeks > 0 && `−${cost.needLoss} on needs, +${cost.strainPct}% decay`}
                </span>
                {bedFree && (
                  <button class="admit" onClick={() => act((g) => admit(g, i))}>
                    Legg inn →
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p class="muted hint">New referral in {nextIn.toFixed(1)} weeks.</p>
    </section>
  );
}
