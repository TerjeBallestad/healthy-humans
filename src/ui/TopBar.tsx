import { OMSORG_PER_NUDGE, SPEEDS } from '../content/tuning';
import { nextWaitDays } from '../sim/discharge';
import { netIncomePerDay, omsorgCap } from '../sim/institution';
import { formatClock, formatDate } from '../sim/time';
import { act, useGame } from '../store';

const SPEED_LABEL: Record<number, string> = { 0: '❚❚', 1: '▶', 2: '▶▶', 4: '▶▶▶' };

export function TopBar() {
  const s = useGame();
  const cap = omsorgCap(s);
  return (
    <header class="topbar">
      <div class="clock">
        <span class="muted">{formatDate(s.minute)}</span>
        <strong>{formatClock(s.minute)}</strong>
      </div>
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
          Omsorg <span class="hint">· {OMSORG_PER_NUDGE} per nudge</span>
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
          {Math.floor(s.budget)} kr <span class="muted">+{netIncomePerDay(s)}/day</span>
        </strong>
      </div>
      <div class="queue">
        <span>
          <span class="muted">Helped</span> <strong>{s.discharged.length}</strong>
        </span>
        <span>
          <span class="muted">Waiting</span> <strong>{s.waiting.length}</strong>
          {s.waiting.length > 0 && (
            <span class="muted"> · first in line {nextWaitDays(s)} days</span>
          )}
        </span>
      </div>
    </header>
  );
}
