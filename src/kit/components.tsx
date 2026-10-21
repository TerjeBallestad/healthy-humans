// Kit pieces that are not a plain 9-slice: bars and rings with a fill. The 9-slices are CSS
// classes in kit.css (`kit-<name>`), set on any element.
import { PIECES } from './manifest';
import './base.css';
import './kit.css';

const IMAGES = import.meta.glob<string>('./img/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** URL of a kit image, e.g. kitImage('bar-need', 'good') or kitImage('bar-need', 'good', true). */
export function kitImage(piece: string, state: string, fill = false): string {
  return IMAGES[`./img/${piece}${fill ? '-fill' : ''}-${state}.png`] ?? '';
}

export function kitPiece(name: string) {
  const p = PIECES.find((p) => p.name === name);
  if (!p) throw new Error(`No kit piece ${name}. Run npm run kit.`);
  return p;
}

/** A bar sprite with its fill cut at a whole pixel. `value` is 0 to 1. */
export function KitBar({ piece, value, state }: { piece: string; value: number; state?: string }) {
  const p = kitPiece(piece);
  const s = state ?? p.states[0]!;
  const shown = Math.round(Math.max(0, Math.min(1, value)) * p.w);
  return (
    <div
      class="kit-sprite"
      style={{
        width: `${p.w}px`,
        height: `${p.h}px`,
        backgroundImage: `url(${kitImage(piece, s)})`,
      }}
    >
      {p.fill && (
        <div
          class="kit-sprite"
          style={{
            width: `${p.w}px`,
            height: `${p.h}px`,
            backgroundImage: `url(${kitImage(piece, s, true)})`,
            clipPath: `inset(0 ${p.w - shown}px 0 0)`,
          }}
        />
      )}
    </div>
  );
}

/**
 * A segmented ring that fills clockwise from the top, a whole segment at a time. Without a fill
 * layer, a dimmed copy of the sprite is the empty track.
 */
export function KitRing({
  piece,
  value,
  segments,
}: {
  piece: string;
  value: number;
  segments: number;
}) {
  const p = kitPiece(piece);
  const s = p.states[0]!;
  const turn = Math.floor(Math.max(0, Math.min(1, value)) * segments) / segments;
  const size = { width: `${p.w}px`, height: `${p.h}px` };
  const mask = `conic-gradient(#000 ${turn}turn, transparent 0)`;
  return (
    <div class="kit-ring" style={size}>
      <div
        class={`kit-sprite${p.fill ? '' : ' kit-track'}`}
        style={{ ...size, backgroundImage: `url(${kitImage(piece, s)})` }}
      />
      <div
        class="kit-sprite"
        style={{
          ...size,
          backgroundImage: `url(${kitImage(piece, s, p.fill)})`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
    </div>
  );
}
