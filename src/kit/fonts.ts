// Loads the fonts in src/kit/fonts/ at runtime. The folder is in .gitignore, because the licence
// forbids redistribution and the repo is public. Without it (CI, a fresh clone) the list is empty
// and the fallback font shows. Files are named "<Family> <Weight>.ttf", as in the Salmon pack:
// "Salmon Sans 9 Bold.ttf" is the family "Salmon Sans 9" at weight 700.

const FILES = import.meta.glob<string>('./fonts/**/*.{ttf,otf,woff,woff2}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const WEIGHTS: [suffix: string, weight: number][] = [
  ['Extra Bold', 800],
  ['Bold', 700],
  ['Regular', 400],
];

export interface KitFont {
  family: string;
  weight: number;
  url: string;
}

export const KIT_FONTS: KitFont[] = Object.entries(FILES)
  .map(([path, url]) => {
    const name = path
      .split('/')
      .pop()!
      .replace(/\.\w+$/, '');
    const [suffix, weight] = WEIGHTS.find(([s]) => name.endsWith(` ${s}`)) ?? ['', 400];
    return { family: suffix ? name.slice(0, -suffix.length - 1) : name, weight, url };
  })
  .sort((a, b) => a.family.localeCompare(b.family) || a.weight - b.weight);

/** Family names, each once. */
export const KIT_FAMILIES: string[] = [...new Set(KIT_FONTS.map((f) => f.family))];

/** Register every font with the document. Resolves when all have loaded. */
export function loadKitFonts(): Promise<unknown> {
  return Promise.all(
    KIT_FONTS.map(async (f) => {
      const face = new FontFace(f.family, `url("${f.url}")`, { weight: String(f.weight) });
      document.fonts.add(await face.load());
    }),
  );
}
