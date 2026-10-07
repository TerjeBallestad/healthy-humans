import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';

const open = signal(false);

// Toggle with the backtick key. Tools are added as the sim grows.
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
          <p class="muted">Build {__BUILD_TIME__}</p>
        </aside>
      )}
    </>
  );
}
