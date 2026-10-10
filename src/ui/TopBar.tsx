import { SPEEDS } from '../content/tuning';
import { netIncomePerWeek, omsorgCap } from '../sim/institution';
import { isSeen } from '../sim/reveal';
import { formatDate } from '../sim/time';
import { act, useGame } from '../store';

const SPEED_LABEL: Record<number, string> = { 0: '❚❚', 1: '▶', 2: '▶▶', 4: '▶▶▶' };

export function TopBar() {
  const s = useGame();
  const cap = omsorgCap(s);
  const net = netIncomePerWeek(s);
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
      <div class="omsorg chip" data-tip="omsorg">
        <span class="label">Omsorg</span>
        <div class="meter">
          <div class="fill" style={{ width: `${(s.omsorg / cap) * 100}%` }} />
        </div>
        <span class="value">
          {Math.floor(s.omsorg)}/{cap}
        </span>
      </div>
      <div class="budget chip">
        {Math.floor(s.budget)} kr{' '}
        <span class="muted">
          {net >= 0 ? '+' : ''}
          {net}/w
        </span>
      </div>
      {isSeen(s, 'beds') && (
        <>
          <div class="chip" title="Helped">
            👷 {s.discharged.length}
          </div>
          <div class="chip" title="Lost">
            💀 {s.lost}
          </div>
        </>
      )}
    </header>
  );
}
