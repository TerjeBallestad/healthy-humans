// Exports Terje's UI kit from assets/*.aseprite into src/kit/: one PNG per state, a CSS 9-slice
// class per piece, and a manifest for the gallery (tools/kit/). Run it after a change in Aseprite:
//   npm run kit
// CI has no Aseprite, so the output is committed.
//
// Conventions in the .aseprite files:
// - A tag names a state (normal, hover, pressed, disabled, ...). Untagged frames are named by index.
// - A slice with a 9-patch centre makes the piece a 9-slice. The first slice counts.
// - A layer named `label` or starting with `Reference` is not exported. Text comes from the font.
//   The label's colours per state become CSS: the most common colour is the text, the second (if
//   any) a 1 px outline. A label that moves down in a state moves the text down by as much.
// - A layer named `fill` is exported on its own, for bars and rings. The rest is the background.
// OVERRIDES covers files that do not follow the conventions yet.
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const ASSETS = 'assets';
const OUT = 'src/kit';
const IMG = join(OUT, 'img');

const OVERRIDES: Record<
  string,
  { label?: string[]; skip?: string[]; fill?: string[]; states?: string[] }
> = {
  // Layer 2 is a hidden, flattened copy of the whole button.
  'button-1': { label: ['Layer 1'], skip: ['Layer 2'] },
  'button-3': { label: ['Layer 1'], skip: ['Layer 2'] },
  'button-quiet': { states: ['normal', 'hover', 'pressed', 'disabled'] },
  'bar-health': { fill: ['Layer 2', 'Layer 3'] },
};

/**
 * Space between the edge and the content in px, [vertical, horizontal], by name prefix. The slice
 * only says where the image stretches, so the content does not follow it. Godot keeps the two
 * apart too: texture margins and content margins in StyleBoxTexture.
 */
const CONTENT: [prefix: string, padding: [number, number]][] = [
  ['button', [3, 6]],
  ['card', [6, 6]],
  ['window', [10, 10]],
];

/** The font of the labels drawn in Aseprite. The fonts are local only (src/kit/fonts.ts). */
const LABEL_FONT = "'Salmon Sans 9', ui-sans-serif, sans-serif";
const LABEL_WEIGHT = 800;

function aseprite(): string {
  const steam = join(
    process.env.HOME ?? '',
    'Library/Application Support/Steam/steamapps/common/Aseprite/Aseprite.app/Contents/MacOS/aseprite',
  );
  const app = '/Applications/Aseprite.app/Contents/MacOS/aseprite';
  return process.env.ASEPRITE ?? [steam, app].find(existsSync) ?? 'aseprite';
}
const BIN = aseprite();
const run = (args: string[]) => execFileSync(BIN, ['-b', ...args], { stdio: 'pipe' });

interface Meta {
  frames: { sourceSize: { w: number; h: number } }[];
  meta: {
    frameTags?: { name: string; from: number; to: number }[];
    layers?: { name: string }[];
    slices?: {
      keys: {
        bounds: { x: number; y: number };
        center?: { x: number; y: number; w: number; h: number };
      }[];
    }[];
  };
}

export interface KitPiece {
  name: string;
  w: number;
  h: number;
  states: string[];
  /** Border widths of the 9-slice: top, right, bottom, left. Null for a plain sprite. */
  slice: [number, number, number, number] | null;
  /** True when a separate fill image exists (`<name>-fill-<state>.png`). */
  fill: boolean;
  /** The label in each state, read from the label layer. Absent without a label layer. */
  label?: Record<string, KitLabel>;
}

export interface KitLabel {
  color: string;
  /** A 1 px outline on four sides. */
  outline?: string;
  /** Rows the label sits below its place in the first state. */
  dy: number;
}

/** Read the label layers' colours and top row per frame, with scripts/kit-label.lua. */
function readLabels(file: string, layers: string[], states: string[]): Record<string, KitLabel> {
  const lines = execFileSync(BIN, [
    '-b',
    file,
    '--script-param',
    `layers=${layers.join('|')}`,
    '--script',
    'scripts/kit-label.lua',
  ])
    .toString()
    .trim()
    .split('\n');
  const rows = lines.map((line) => {
    const [top, ...counts] = line.trim().split(' ');
    const colors = counts
      .map((c) => c.split(':') as [string, string])
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([c]) => c);
    return { top: Number(top), colors };
  });
  const base = rows[0]?.top ?? 0;
  return Object.fromEntries(
    states.map((s, i) => {
      const r = rows[i]!;
      const label: KitLabel = { color: r.colors[0] ?? 'inherit', dy: r.top - base };
      if (r.colors[1]) label.outline = r.colors[1];
      return [s, label];
    }),
  );
}

function exportPiece(file: string, tmp: string): KitPiece {
  const name = basename(file, '.aseprite');
  run([
    '--all-layers',
    '--list-tags',
    '--list-slices',
    '--list-layers',
    file,
    '--data',
    join(tmp, 'meta.json'),
    '--format',
    'json-array',
    '--sheet',
    join(tmp, 'sheet.png'),
  ]);
  const meta = JSON.parse(readFileSync(join(tmp, 'meta.json'), 'utf8')) as Meta;
  const { w, h } = meta.frames[0]!.sourceSize;
  const layers = (meta.meta.layers ?? []).map((l) => l.name);
  const o = OVERRIDES[name] ?? {};
  const label = o.label ?? layers.filter((l) => l === 'label');
  const skip = [
    ...label,
    ...layers.filter((l) => l.startsWith('Reference') || o.skip?.includes(l)),
  ];
  const fill = o.fill ?? layers.filter((l) => l === 'fill');

  // One state per single-frame tag, else one per frame. A lone untagged frame is `normal`.
  const tags = meta.meta.frameTags ?? [];
  const states =
    o.states ??
    (meta.frames.length === 1 && !tags.length
      ? ['normal']
      : meta.frames.map((_, i) => tags.find((t) => t.from === i && t.to === i)?.name ?? String(i)));

  states.forEach((state, i) => {
    const frame = ['--frame-range', `${i},${i}`];
    const ignore = [...skip, ...fill].flatMap((l) => ['--ignore-layer', l]);
    run([...ignore, ...frame, file, '--save-as', join(IMG, `${name}-${state}.png`)]);
    if (fill.length) {
      const only = fill.flatMap((l) => ['--layer', l]);
      run([...only, ...frame, file, '--save-as', join(IMG, `${name}-fill-${state}.png`)]);
    }
  });

  const key = meta.meta.slices?.[0]?.keys[0];
  let slice: KitPiece['slice'] = null;
  if (key?.center) {
    // The centre is relative to the slice bounds. The borders are relative to the image.
    const left = key.bounds.x + key.center.x;
    const top = key.bounds.y + key.center.y;
    slice = [top, w - left - key.center.w, h - top - key.center.h, left];
  }
  const piece: KitPiece = { name, w, h, states, slice, fill: fill.length > 0 };
  if (label.length) piece.label = readLabels(file, label, states);
  return piece;
}

/** Map a tag to the CSS selectors that show it, so a plain <button> gets its states for free. */
const PSEUDO: Record<string, string[]> = {
  hover: [':hover:not(:disabled)'],
  pressed: [':active:not(:disabled)'],
  disabled: [':disabled', '[aria-disabled="true"]'],
};

/** Text colour, outline and shift of a label, as CSS lines. */
function labelCss(label: KitLabel | undefined, py: number): string {
  if (!label) return '';
  const o = label.outline;
  const shadow = o ? `1px 0 ${o}, -1px 0 ${o}, 0 1px ${o}, 0 -1px ${o}` : 'none';
  // The outline needs a column between letters, as in the Aseprite labels.
  return (
    `  color: ${label.color};\n  text-shadow: ${shadow};\n  letter-spacing: ${o ? 1 : 0}px;\n` +
    `  padding-top: ${py + label.dy}px;\n  padding-bottom: ${py - label.dy}px;\n`
  );
}

function css(pieces: KitPiece[]): string {
  const out = ['/* Generated by scripts/kit.ts from assets/*.aseprite. Do not edit. */', ''];
  for (const p of pieces.filter((p) => p.slice)) {
    const [t, r, b, l] = p.slice!;
    const cls = `.kit-${p.name}`;
    const [py, px] = CONTENT.find(([prefix]) => p.name.startsWith(prefix))?.[1] ?? [4, 4];
    // The image covers the whole box (border-image-width), and the border takes no space, so
    // padding alone places the content. No background, so the transparent corners stay
    // transparent on a <button>. `repeat` tiles the edges and the middle, as Godot's
    // StyleBoxTexture does with axis_stretch TILE. Below the min size the corners would shrink.
    out.push(
      `${cls} {\n  box-sizing: border-box;\n  border: 0 solid;\n  background: none;\n` +
        `  border-image: url('./img/${p.name}-${p.states[0]}.png') ${t} ${r} ${b} ${l} fill / ${t}px ${r}px ${b}px ${l}px repeat;\n` +
        `  padding: ${py}px ${px}px;\n  min-width: ${l + r}px;\n  min-height: ${t + b}px;\n` +
        `  image-rendering: pixelated;\n` +
        (p.label ? `  font-family: ${LABEL_FONT};\n  font-weight: ${LABEL_WEIGHT};\n` : '') +
        labelCss(p.label?.[p.states[0]!], py) +
        `}`,
    );
    for (const s of p.states.slice(1)) {
      const sel = [`${cls}[data-state='${s}']`, ...(PSEUDO[s] ?? []).map((x) => cls + x)];
      out.push(
        `${sel.join(',\n')} {\n  border-image-source: url('./img/${p.name}-${s}.png');\n` +
          labelCss(p.label?.[s], py) +
          `}`,
      );
    }
    out.push('');
  }
  return out.join('\n');
}

const files = readdirSync(ASSETS)
  .filter((f) => f.endsWith('.aseprite'))
  .sort()
  .map((f) => join(ASSETS, f));
rmSync(IMG, { recursive: true, force: true });
mkdirSync(IMG, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'kit-'));
const pieces = files.map((f) => exportPiece(f, tmp));
rmSync(tmp, { recursive: true, force: true });

writeFileSync(join(OUT, 'kit.css'), css(pieces));
writeFileSync(
  join(OUT, 'manifest.ts'),
  '// Generated by scripts/kit.ts from assets/*.aseprite. Do not edit.\n' +
    "import type { KitPiece } from '../../scripts/kit';\n\n" +
    `export const PIECES: KitPiece[] = ${JSON.stringify(pieces, null, 2)};\n`,
);
console.log(`${pieces.length} pieces -> ${OUT}/`);
for (const p of pieces) {
  console.log(
    `  ${p.name.padEnd(24)} ${p.w}x${p.h}  ${p.slice ? `9-slice ${p.slice.join('/')}` : 'sprite'}  ${p.states.join(', ')}${p.fill ? '  +fill' : ''}${p.label ? '  +label' : ''}`,
  );
}
