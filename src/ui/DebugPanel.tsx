import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { NEED_ORDER } from '../content/needs';
import { DEBUG_SPEEDS } from '../content/tuning';
import { omsorgCap } from '../sim/institution';
import { act, resetGame } from '../store';

const open = signal(false);

// Toggle with the backtick key.
export function DebugPanel() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') open.value = !open.value;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button class="debug-toggle" onClick={() => (open.value = !open.value)} aria-label="Debug">
        ⚙
      </button>
      {open.value && (
        <aside class="debug">
          <strong>Debug</strong>
          <div class="row">
            {DEBUG_SPEEDS.map((sp) => (
              <button onClick={() => act((g) => (g.speed = sp))}>{sp}x</button>
            ))}
          </div>
          <div class="row">
            <button onClick={() => act((g) => (g.omsorg = omsorgCap(g)))}>Fill omsorg</button>
            <button onClick={() => act((g) => (g.budget += 1000))}>+1000 kr</button>
            <button
              onClick={() =>
                act((g) => NEED_ORDER.forEach((n) => (g.resident.needs[n] = 100)))
              }
            >
              Fill needs
            </button>
          </div>
          <div class="row">
            <button onClick={resetGame}>Reset save</button>
          </div>
          <p class="muted">Build {__BUILD_TIME__}</p>
        </aside>
      )}
    </>
  );
}
