import { ACTIVITIES } from '../content/activities';
import { ARCHETYPE_BY_ID, type ArchetypeId } from '../content/archetypes';
import { TRAIT_BY_ID, type TraitId } from '../content/traits';
import {
  HARD_EFFORT,
  WAIT_HEALTH_LOSS_PER_WEEK,
  WAIT_NEED_LOSS_PER_HEALTH,
  WAIT_STRAIN_PER_HEALTH,
  WAIT_URGENT_HEALTH,
  WAITLIST_WEEKS_PER_PERSON,
  barSize,
} from '../content/tuning';
import { admit, freeBed } from '../sim/actions';
import type { WaitingPerson } from '../sim/state';
import { TICKS_PER_WEEK } from '../sim/time';
import { act, useGame } from '../store';
import { closeModal, modal, openModal } from './modal';

const healthLevel = (p: WaitingPerson) =>
  p.health < WAIT_URGENT_HEALTH ? 'bad' : p.health < 40 ? 'worse' : '';

/** List indexes, lowest health first. The worst off sit on top. */
const byHealth = (waiting: WaitingPerson[]) =>
  waiting.map((_, i) => i).sort((a, b) => waiting[a]!.health - waiting[b]!.health);

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
        {byHealth(s.waiting).map((i) => {
          const p = s.waiting[i]!;
          const trait = TRAIT_BY_ID[p.trait];
          return (
            <li class={healthLevel(p)}>
              <button class="wait-row" onClick={() => openModal({ kind: 'patient', index: i })}>
                <span class="who">
                  {ARCHETYPE_BY_ID[p.archetype].name}
                  <span class="tag">{trait.label}</span>
                </span>
                <span class="meter" title="Health">
                  <span class="fill" style={{ width: `${p.health}%` }} />
                </span>
                <SkillSheet archetype={p.archetype} trait={p.trait} />
              </button>
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

/** The referral, in full: face, story, health and what they can do. */
export function PatientCard() {
  const s = useGame();
  const m = modal.value;
  if (m?.kind !== 'patient') return null;
  const p = s.waiting[m.index];
  if (!p) return null;
  const a = ARCHETYPE_BY_ID[p.archetype];
  const trait = TRAIT_BY_ID[p.trait];
  const traitSkill = trait.startSkill ?? {};
  const missing = 100 - p.health;
  const weeksLeft = p.health / WAIT_HEALTH_LOSS_PER_WEEK;
  const bedFree = freeBed(s) >= 0;
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div class="dialog patient-card" role="dialog" aria-modal="true" aria-label={a.name}>
        <header>
          <span class="muted">Henvisning</span>
          <button class="close" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </header>
        <div class="profile">
          <div class="profile-head">
            <strong>{a.name}</strong>
            <span class="trait-tag">{trait.label}</span>
          </div>
          <div class="profile-body">
            <span class="portrait" aria-hidden="true">
              {a.face}
            </span>
            <div class="story">
              <p>{a.intro}</p>
              <p class="muted">{trait.effect}.</p>
            </div>
          </div>
          <div class={`health ${healthLevel(p)}`}>
            <div class="health-head">
              <span>Health</span>
              <strong>{Math.ceil(p.health)}</strong>
            </div>
            <span class="meter">
              <span class="fill" style={{ width: `${p.health}%` }} />
            </span>
            <p class="muted">
              Drops {WAIT_HEALTH_LOSS_PER_WEEK} a week.{' '}
              {weeksLeft < 1
                ? 'Less than a week left.'
                : `About ${Math.floor(weeksLeft)} weeks left.`}
              {missing > 0 &&
                ` Moves in with needs ${Math.round(missing * WAIT_NEED_LOSS_PER_HEALTH)} lower and ${Math.round(missing * WAIT_STRAIN_PER_HEALTH * 100)}% faster decay.`}
            </p>
          </div>
          <table class="stats">
            <thead>
              <tr>
                <th />
                <th>Starts at</th>
                <th>Nudges</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITIES.map((act) => {
                const level = Math.max(a.skills[act.id] ?? 0, traitSkill[act.id] ?? 0);
                const hard = a.hard.includes(act.id);
                const nudges = barSize(level) * (hard ? HARD_EFFORT : 1);
                return (
                  <tr class={level > 0 ? 'strong' : hard ? 'hard' : ''}>
                    <td>{act.label}</td>
                    <td class="value">{level > 0 ? `lvl ${level}` : '–'}</td>
                    <td class="value">
                      {nudges === 0 ? 'independent' : nudges}
                      {hard && <span class="hard-mark"> ×{HARD_EFFORT}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {bedFree && (
          <button
            class="buy-request admit-big"
            onClick={() => {
              act((g) => admit(g, m.index));
              closeModal();
            }}
          >
            Legg inn →
          </button>
        )}
      </div>
    </div>
  );
}
