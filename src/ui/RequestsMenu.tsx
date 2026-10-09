import { signal } from '@preact/signals';
import { UPGRADES, UPGRADE_BY_ID, type UpgradeDef } from '../content/upgrades';
import { buyUpgrade } from '../sim/actions';
import { canBuy, offered } from '../sim/institution';
import { act, useGame } from '../store';

const open = signal(false);

/** Open the menu and pause, so there is time to read. */
export function openRequests() {
  open.value = true;
  act((g) => {
    g.resumeSpeed = g.speed || g.resumeSpeed;
    g.speed = 0;
  });
}

function closeRequests() {
  open.value = false;
  act((g) => (g.speed = g.resumeSpeed));
}

/** Requests the player can buy right now, for the button badge. */
export function affordableRequests(s: ReturnType<typeof useGame>): number {
  return UPGRADES.filter((u) => canBuy(s, u.id)).length;
}

export function RequestsMenu() {
  useGame();
  if (!open.value) return null;
  const pane = (id: UpgradeDef['pane']) => UPGRADES.filter((u) => u.pane === id && !u.coachStep);
  const coach = UPGRADES.filter((u) => u.coachStep);
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && closeRequests()}>
      <div class="dialog requests" role="dialog" aria-modal="true" aria-label="Requests">
        <header>
          <h2>Requests to the kommune</h2>
          <button class="close" onClick={closeRequests} aria-label="Close">
            ✕
          </button>
        </header>
        <div class="panes">
          <section>
            <h3>Your work</h3>
            {pane('you').map((u) => (
              <RequestCard u={u} />
            ))}
          </section>
          <section>
            <h3>Staff</h3>
            {pane('staff').map((u) => (
              <RequestCard u={u} />
            ))}
            <h3>Coach</h3>
            {coach.map((u) => (
              <RequestCard u={u} />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ u }: { u: UpgradeDef }) {
  const s = useGame();
  const bought = s.upgrades.includes(u.id);
  const state = bought ? 'bought' : offered(s, u.id) ? '' : 'locked';
  return (
    <article class={`request ${state}`}>
      <div class="head">
        <strong>{u.label}</strong>
        {bought ? (
          <span class="tag">Bought</span>
        ) : (
          <button
            class="buy-request"
            disabled={!canBuy(s, u.id)}
            onClick={() => act((g) => buyUpgrade(g, u.id))}
          >
            {u.cost} kr
          </button>
        )}
      </div>
      {u.note && <p class="muted note">{u.note}</p>}
      <p>{u.description}</p>
      {state === 'locked' && u.after && (
        <p class="muted">After: {UPGRADE_BY_ID[u.after].label.toLowerCase()}</p>
      )}
    </article>
  );
}
