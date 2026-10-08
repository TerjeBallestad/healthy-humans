import { WAIT_NEED_FLOOR, WAITLIST_DAYS_PER_PERSON } from '../content/tuning';
import { nextArchetype, waitCost } from '../sim/discharge';
import { useGame } from '../store';

export function WaitingList() {
  const s = useGame();
  const period = WAITLIST_DAYS_PER_PERSON * 1440;
  const nextIn = (period - (s.minute % period)) / 1440;
  return (
    <section class="panel waitlist">
      <h3>
        Venteliste <span class="count">{s.waiting.length}</span>
      </h3>
      {s.waiting.length === 0 && <p class="muted">Nobody is waiting.</p>}
      <ol>
        {s.waiting.map((joined, i) => {
          const days = Math.floor((s.minute - joined) / 1440);
          const cost = waitCost(days);
          const left = 1 - cost.needLoss / (100 - WAIT_NEED_FLOOR);
          const level = cost.strainPct >= 20 ? 'bad' : cost.strainPct > 0 ? 'worse' : '';
          return (
            <li class={level}>
              <span class="who">
                {i === 0 ? nextArchetype(s).name : 'Referral'}
                <span class="muted">
                  {' '}
                  · {days} {days === 1 ? 'day' : 'days'}
                </span>
                {i === 0 && <span class="tag">next</span>}
              </span>
              <span class="meter">
                <span class="fill" style={{ width: `${left * 100}%` }} />
              </span>
              <span class="cost">
                {days === 0
                  ? 'Just referred'
                  : `Arrives −${cost.needLoss} on needs, decays +${cost.strainPct}%`}
              </span>
            </li>
          );
        })}
      </ol>
      <p class="muted hint">New referral in {nextIn.toFixed(1)} days.</p>
    </section>
  );
}
