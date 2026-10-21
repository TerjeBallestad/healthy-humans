// Exports Terje's UI kit from assets/*.aseprite into src/kit/: one PNG per state, a CSS 9-slice
// class per piece, and a manifest for the gallery (tools/kit/). Run it after a change in Aseprite:
//   npm run kit
// CI has no Aseprite, so the output is committed.
//
// Conventions in the .aseprite files:
// - A tag names a state (normal, hover, pressed, disabled, ...). Untagged frames are named by index.
// - A slice with a 9-patch centre makes the piece a 9-slice. The first slice counts.
// - A layer named `label` or starting with `Reference` is not exported. Text comes from the font.
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
const FONTS = join(OUT, 'fonts');

const OVERRIDES: Record<string, { skip?: string[]; fill?: string[]; states?: string[] }> = {
  'button-1': { skip: ['Layer 1', 'Layer 2'] },
  'button-3': { skip: ['Layer 1', 'Layer 2'] },
  'button-quiet': { states: ['normal', 'hover', 'pressed', 'disabled'] },
  'bar-health': { fill: ['Layer 2', 'Layer 3'] },
};

/**
 * Space between the edge and the content, by name prefix. The slice only says where the image
 * stretches, so the content does not follow it. Godot keeps the two apart too: texture margins
 * and content margins in StyleBoxTexture.
 */
const CONTENT: [prefix: string, padding: string][] = [
  ['button', '3px 6px'],
  ['card', '6px'],
  ['window', '10px'],
];

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
  const skip = layers.filter(
    (l) => l === 'label' || l.startsWith('Reference') || o.skip?.includes(l),
  );
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
  return { name, w, h, states, slice, fill: fill.length > 0 };
}

/** Map a tag to the CSS selectors that show it, so a plain <button> gets its states for free. */
const PSEUDO: Record<string, string[]> = {
  hover: [':hover:not(:disabled)'],
  pressed: [':active:not(:disabled)'],
  disabled: [':disabled', '[aria-disabled="true"]'],
};

function css(pieces: KitPiece[], fonts: string[]): string {
  const out = ['/* Generated by scripts/kit.ts from assets/*.aseprite. Do not edit. */', ''];
  for (const f of fonts) {
    const family = basename(f).replace(/\.(ttf|otf|woff2?)$/i, '');
    out.push(`@font-face {\n  font-family: '${family}';\n  src: url('./fonts/${f}');\n}`, '');
  }
  for (const p of pieces.filter((p) => p.slice)) {
    const [t, r, b, l] = p.slice!;
    const cls = `.kit-${p.name}`;
    const pad = CONTENT.find(([prefix]) => p.name.startsWith(prefix))?.[1] ?? '4px';
    // The image covers the whole box (border-image-width), and the border takes no space, so
    // padding alone places the content. `repeat` tiles the edges and the middle, as Godot's
    // StyleBoxTexture does with axis_stretch TILE. Below the min size the corners would shrink.
    out.push(
      `${cls} {\n  box-sizing: border-box;\n  border: 0 solid;\n` +
        `  border-image: url('./img/${p.name}-${p.states[0]}.png') ${t} ${r} ${b} ${l} fill / ${t}px ${r}px ${b}px ${l}px repeat;\n` +
        `  padding: ${pad};\n  min-width: ${l + r}px;\n  min-height: ${t + b}px;\n` +
        `  image-rendering: pixelated;\n}`,
    );
    for (const s of p.states.slice(1)) {
      const sel = [`${cls}[data-state='${s}']`, ...(PSEUDO[s] ?? []).map((x) => cls + x)];
      out.push(`${sel.join(',\n')} {\n  border-image-source: url('./img/${p.name}-${s}.png');\n}`);
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
mkdirSync(FONTS, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'kit-'));
const pieces = files.map((f) => exportPiece(f, tmp));
rmSync(tmp, { recursive: true, force: true });
const fonts = readdirSync(FONTS)
  .filter((f) => /\.(ttf|otf|woff2?)$/i.test(f))
  .sort();

writeFileSync(join(OUT, 'kit.css'), css(pieces, fonts));
writeFileSync(
  join(OUT, 'manifest.ts'),
  '// Generated by scripts/kit.ts from assets/*.aseprite. Do not edit.\n' +
    "import type { KitPiece } from '../../scripts/kit';\n\n" +
    `export const PIECES: KitPiece[] = ${JSON.stringify(pieces, null, 2)};\n\n` +
    `/** Font families from src/kit/fonts/, named by file. */\n` +
    `export const FONTS: string[] = ${JSON.stringify(fonts.map((f) => f.replace(/\.(ttf|otf|woff2?)$/i, '')))};\n`,
);
console.log(`${pieces.length} pieces, ${fonts.length} fonts -> ${OUT}/`);
for (const p of pieces) {
  console.log(
    `  ${p.name.padEnd(24)} ${p.w}x${p.h}  ${p.slice ? `9-slice ${p.slice.join('/')}` : 'sprite'}  ${p.states.join(', ')}${p.fill ? '  +fill' : ''}`,
  );
}
