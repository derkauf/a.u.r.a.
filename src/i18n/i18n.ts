/**
 * A.U.R.A. v1 — Localization (locale files + English fallback).
 *
 * Every file in src/locales/ is one language: `en.json`, `pt-BR.json`,
 * `es.json`... The file name is the locale code and `_meta.name` is the
 * language's own name, shown in the language selector. Adding a language
 * is dropping a new file there; the selector lists whatever files exist.
 *
 * English (`en.json`) is the default and the fallback: a key missing from
 * another locale shows the English text. The message keys are typed from
 * en.json, so a typo in a key is a type error.
 *
 * The choice persists in localStorage. Systems subscribe to locale
 * changes and re-apply text to their UIKitML elements.
 */
import en from '../locales/en.json';

export type Locale = string;
export type MessageKey = Exclude<keyof typeof en, '_meta.name'>;
type Messages = Partial<Record<string, string>>;

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'aura_locale';

/** All locale files, keyed by code (from the file name). */
const MESSAGES: Record<Locale, Messages> = Object.fromEntries(
  Object.entries(import.meta.glob<Messages>('../locales/*.json', { eager: true, import: 'default' })).map(
    ([file, messages]) => [file.replace(/^.*\/(.+)\.json$/u, '$1'), messages],
  ),
);
const FALLBACK: Messages = en as Messages;

/** The language's own name (e.g. "Deutsch"), from its file's `_meta.name`. */
export function getLocaleName(locale: Locale): string {
  return MESSAGES[locale]?.['_meta.name'] ?? locale;
}

/** Available locales: English first, then the others by their own name. */
export const LOCALES: readonly Locale[] = Object.keys(MESSAGES).sort((a, b) => {
  if (a === DEFAULT_LOCALE) return -1;
  if (b === DEFAULT_LOCALE) return 1;
  return getLocaleName(a).localeCompare(getLocaleName(b));
});

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in MESSAGES;
}

function readStoredLocale(): Locale {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_LOCALE;
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

let currentLocale: Locale = readStoredLocale();
const listeners = new Set<(locale: Locale) => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale || !isLocale(locale)) return;
  currentLocale = locale;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Persistence is best effort; the in-memory locale still applies.
  }
  listeners.forEach((fn) => fn(locale));
}

/** Step to the next (+1) or previous (-1) available locale, wrapping around. */
export function cycleLocale(step: 1 | -1): void {
  const index = Math.max(0, LOCALES.indexOf(currentLocale));
  setLocale(LOCALES[(index + step + LOCALES.length) % LOCALES.length]);
}

export function subscribeLocale(fn: (locale: Locale) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Translate a key in the current locale (English fallback); `{value}` is replaced when given. */
export function t(key: MessageKey, value?: string | number): string {
  const template = MESSAGES[currentLocale]?.[key] ?? FALLBACK[key] ?? key;
  return value === undefined ? template : template.replace('{value}', String(value));
}
