import { OMSORG_PER_NUDGE, SPEEDS } from '../content/tuning';
import { netIncomePerWeek, nudgeMult, omsorgCap } from '../sim/institution';
import { formatDate } from '../sim/time';
import { act, useGame } from '../store';

const SPEED_LABEL: Record<number, string> = { 0: '❚❚', 1: '▶', 2: '▶▶', 4: '▶▶▶' };

export function TopBar() {
  const s = useGame();
  const cap = omsorgCap(s);
  return (
    <header class="topbar">
      <div class="date chip">{formatDate(s.tick)}</div>
      <div class="speeds">
        {SPEEDS.map((sp) => (
          <button
            class={s.speed === sp ? 'speed active' : 'speed'}
            onClick={() => act((g) => (g.speed = sp))}
          >
            {SPEED_LABEL[sp]}
          </button>
        ))}
      </div>
      <div class="omsorg">
        <span class="muted">
          Omsorg{' '}
          <span class="hint">
            · {OMSORG_PER_NUDGE} per nudge
            {nudgeMult(s) > 1 && `, fills ${nudgeMult(s)}`}
          </span>
        </span>
        <strong>
          {Math.floor(s.omsorg)} <span class="muted">/ {cap}</span>
        </strong>
        <div class="meter">
          <div class="fill" style={{ width: `${(s.omsorg / cap) * 100}%` }} />
        </div>
      </div>
      <div class="budget">
        <span class="muted">Budget</span>
        <strong>
          {Math.floor(s.budget)} kr <span class="muted">+{netIncomePerWeek(s)}/week</span>
        </strong>
      </div>
      <div class="helped">
        <span class="muted">Helped</span>
        <strong>{s.discharged.length}</strong>
      </div>
      <div class="helped">
        <span class="muted">Lost</span>
        <strong>{s.lost}</strong>
      </div>
    </header>
  );
}
