import { OMSORG_CAP, SPEEDS } from '../content/tuning';
import { formatClock, formatDate } from '../sim/time';
import { act, useGame } from '../store';

const SPEED_LABEL: Record<number, string> = { 0: '❚❚', 1: '▶', 2: '▶▶', 4: '▶▶▶' };

export function TopBar() {
  const s = useGame();
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
        <span class="muted">Omsorg</span>
        <strong>
          {Math.floor(s.omsorg)} <span class="muted">/ {OMSORG_CAP}</span>
        </strong>
        <div class="meter">
          <div class="fill" style={{ width: `${(s.omsorg / OMSORG_CAP) * 100}%` }} />
        </div>
      </div>
    </header>
  );
}
