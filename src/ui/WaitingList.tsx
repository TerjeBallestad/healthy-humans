import { ACTIVITIES } from '../content/activities';
import { ARCHETYPE_BY_ID, type ArchetypeId } from '../content/archetypes';
import { TRAIT_BY_ID, type TraitId } from '../content/traits';
import { HARD_EFFORT, WAIT_URGENT_HEALTH, WAITLIST_WEEKS_PER_PERSON } from '../content/tuning';
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
          const level = p.health < WAIT_URGENT_HEALTH ? 'bad' : p.health < 40 ? 'worse' : '';
          return (
            <li class={level}>
              <span class="who">
                {ARCHETYPE_BY_ID[p.archetype].name}
                <span class="tag">{trait.label}</span>
              </span>
              <span class="meter" title="Health">
                <span class="fill" style={{ width: `${p.health}%` }} />
              </span>
              <SkillSheet archetype={p.archetype} trait={p.trait} />
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

/** Strengths as icons with level dots, hard activities with their effort multiplier. */
function SkillSheet({ archetype, trait }: { archetype: ArchetypeId; trait: TraitId }) {
  const a = ARCHETYPE_BY_ID[archetype];
  const traitSkill = TRAIT_BY_ID[trait].startSkill ?? {};
  return (
    <span class="skills">
      {ACTIVITIES.map((act) => {
        const level = Math.max(a.skills[act.id] ?? 0, traitSkill[act.id] ?? 0);
        const hard = a.hard.includes(act.id);
        if (!level && !hard) return null;
        return (
          <span
            class={hard ? 'skill hard' : 'skill'}
            title={`${act.label}: ${level ? `lvl ${level}` : ''}${level && hard ? ', ' : ''}${hard ? `${HARD_EFFORT}× effort` : ''}`}
          >
            {act.icon}
            {level > 0 && <span class="dots">{'●'.repeat(level)}</span>}
            {hard && <span class="dots">×{HARD_EFFORT}</span>}
          </span>
        );
      })}
    </span>
  );
}
