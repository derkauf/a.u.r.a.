/**
 * A.U.R.A. v1 — Panel font with full Latin coverage.
 *
 * UIKit's bundled MSDF fonts (and UIKitML's `@font-face`, which calls
 * TTFLoader with its default ASCII-only charset) have no accented letters,
 * so Portuguese text such as "Lâmpada" or "câmera" lost glyphs. Here the
 * Inter TTF from public/fonts is turned into an MSDF atlas at runtime with
 * an explicit Latin charset, once per weight, and shared by every panel.
 *
 * Apply with `rootElement.setProperties({ fontFamilies: AURA_FONT_FAMILIES })`:
 * font families are inherited, and elements without `font-family` use the
 * first family, so the whole panel picks it up.
 */
import { UIKit } from '@iwsdk/core';

const PRINTABLE_ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('');
const LATIN_1_SUPPLEMENT = Array.from({ length: 0xff - 0xa1 + 1 }, (_, i) => String.fromCharCode(0xa1 + i)).join('');
const PUNCTUATION = '–—‘’“”•…€−';

/** Every character the panels may render in English or Portuguese. */
export const AURA_FONT_CHARSET = PRINTABLE_ASCII + LATIN_1_SUPPLEMENT + PUNCTUATION;

const fontUrl = (file: string): string => `${import.meta.env.BASE_URL}fonts/${file}`;

/**
 * TTFLoader resolves to a font-family record ({ family: { weight: font } });
 * UIKit's weight map needs the single font inside it, as UIKitML extracts it.
 */
function extractFont(result: unknown): unknown {
  const family = Object.values(result as Record<string, Record<string, unknown>>)[0];
  const font = family ? Object.values(family)[0] : undefined;
  if (font == null) throw new Error('A.U.R.A. font: TTF produced no font face');
  return font;
}

/** Concurrent MSDF generation can produce incomplete atlases: run one at a time. */
let generationQueue: Promise<unknown> = Promise.resolve();

function memoizedFont(file: string): () => Promise<unknown> {
  let pending: Promise<unknown> | null = null;
  return () => {
    if (!pending) {
      const generate = (): Promise<unknown> =>
        new UIKit.TTFLoader()
          .loadAsync([
            {
              url: fontUrl(file),
              charset: AURA_FONT_CHARSET,
              // ~200 glyphs do not fit the default 512² atlas at 48 px.
              textureSize: [1024, 1024],
            },
          ])
          .then(extractFont);
      pending = generationQueue.then(generate, generate);
      generationQueue = pending.catch(() => undefined);
    }
    return pending;
  };
}

export const AURA_FONT_FAMILIES = {
  'aura-inter': {
    normal: memoizedFont('Inter-latin-400.ttf'),
    bold: memoizedFont('Inter-latin-700.ttf'),
  },
};
