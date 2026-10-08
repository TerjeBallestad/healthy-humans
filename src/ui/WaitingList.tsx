import { ARCHETYPE_BY_ID } from '../content/archetypes';
import { TRAIT_BY_ID } from '../content/traits';
import { WAIT_URGENT_WEEKS, WAITLIST_WEEKS_PER_PERSON } from '../content/tuning';
import { admit, freeBed } from '../sim/actions';
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
          const trait = TRAIT_BY_ID[p.trait];
          const weeksLeft = Math.ceil((p.leaves - s.tick) / TICKS_PER_WEEK);
          const left = (p.leaves - s.tick) / (p.leaves - p.joined);
          const level = weeksLeft <= WAIT_URGENT_WEEKS ? 'bad' : left < 0.5 ? 'worse' : '';
          return (
            <li class={level}>
              <span class="who">
                {ARCHETYPE_BY_ID[p.archetype].name}
                <span class="tag">{trait.label}</span>
                <span class="muted">
                  {' '}
                  · {weeksLeft} {weeksLeft === 1 ? 'week' : 'weeks'} left
                </span>
              </span>
              <span class="meter">
                <span class="fill" style={{ width: `${left * 100}%` }} />
              </span>
              <span class="row">
                <span class="cost">{trait.effect}</span>
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
