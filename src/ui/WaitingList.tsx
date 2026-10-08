import { WAIT_NEED_FLOOR, WAITLIST_WEEKS_PER_PERSON } from '../content/tuning';
import { nextArchetype, waitCost } from '../sim/discharge';
import { useGame } from '../store';
import { TICKS_PER_WEEK } from '../sim/time';

export function WaitingList() {
  const s = useGame();
  const period = WAITLIST_WEEKS_PER_PERSON * TICKS_PER_WEEK;
  const nextIn = (period - (s.tick % period)) / TICKS_PER_WEEK;
  return (
    <section class="panel waitlist">
      <h3>
        Venteliste <span class="count">{s.waiting.length}</span>
      </h3>
      {s.waiting.length === 0 && <p class="muted">Nobody is waiting.</p>}
      <ol>
        {s.waiting.map((joined, i) => {
          const weeks = Math.floor((s.tick - joined) / TICKS_PER_WEEK);
          const cost = waitCost(weeks);
          const left = 1 - cost.needLoss / (100 - WAIT_NEED_FLOOR);
          const level = cost.strainPct >= 20 ? 'bad' : cost.strainPct > 0 ? 'worse' : '';
          return (
            <li class={level}>
              <span class="who">
                {i === 0 ? nextArchetype(s).name : 'Referral'}
                <span class="muted">
                  {' '}
                  · {weeks} {weeks === 1 ? 'week' : 'weeks'}
                </span>
                {i === 0 && <span class="tag">next</span>}
              </span>
              <span class="meter">
                <span class="fill" style={{ width: `${left * 100}%` }} />
              </span>
              <span class="cost">
                {weeks === 0
                  ? 'Just referred'
                  : `Arrives −${cost.needLoss} on needs, decays +${cost.strainPct}%`}
              </span>
            </li>
          );
        })}
      </ol>
      <p class="muted hint">New referral in {nextIn.toFixed(1)} weeks.</p>
    </section>
  );
}
