/**
 * A.U.R.A. v1 — Localization.
 *
 * English is the default locale; Brazilian Portuguese (pt-BR) is selectable
 * from the Settings panel. The choice persists in localStorage. Systems
 * subscribe to locale changes and re-apply text to their UIKitML elements.
 */

export type Locale = 'en' | 'pt-BR';

export const LOCALES: readonly Locale[] = ['en', 'pt-BR'];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'aura_locale';

const en = {
  'common.eyebrow': 'A.U.R.A. — LIVING ROOM',
  'common.hint': 'Point with your hand and pinch to select.',

  'device.lamp.title': 'Living room lamp',
  'device.ac.title': 'Living room AC',
  'device.lock.title': 'Front door lock',

  'status.lamp.on': 'On • {value}%',
  'status.lamp.off': 'Off',
  'status.ac.on': 'On • {value}°C',
  'status.ac.off': 'Off',
  'status.lock.locked': 'Locked',
  'status.lock.unlocked': 'Unlocked',

  'action.turnOn': 'Turn on',
  'action.turnOff': 'Turn off',
  'action.lock': 'Lock',
  'action.unlock': 'Unlock',
  'action.viewCamera': 'View camera',

  'anchor.waiting': 'Anchor: waiting for XR session…',
  'anchor.waitingRestore': 'Anchor: waiting for XR session (restore)',
  'anchor.active': 'Anchor: active',
  'anchor.activeRestored': 'Anchor: active (restored)',

  'sticker.sub': 'AprilTag tag36h11 • id {value}',

  'camera.eyebrow': 'DOOR CAMERA — SIMULATED',
  'camera.text': 'No live feed (v1)',
  'camera.sub': 'The camera is a placeholder. The live feed comes in a future version.',
  'camera.close': 'Close camera',

  'settings.title': 'Settings',
  'settings.language': 'Language',
} as const;

export type MessageKey = keyof typeof en;

const ptBR: Record<MessageKey, string> = {
  'common.eyebrow': 'A.U.R.A. — SALA',
  'common.hint': 'Aponte com a mão e faça pinch para selecionar.',

  'device.lamp.title': 'Lâmpada da sala',
  'device.ac.title': 'Ar-condicionado da sala',
  'device.lock.title': 'Fechadura da porta',

  'status.lamp.on': 'Ligada • {value}%',
  'status.lamp.off': 'Desligada',
  'status.ac.on': 'Ligado • {value}°C',
  'status.ac.off': 'Desligado',
  'status.lock.locked': 'Trancada',
  'status.lock.unlocked': 'Destrancada',

  'action.turnOn': 'Ligar',
  'action.turnOff': 'Desligar',
  'action.lock': 'Trancar',
  'action.unlock': 'Destrancar',
  'action.viewCamera': 'Ver câmera',

  'anchor.waiting': 'Âncora: aguardando sessão XR…',
  'anchor.waitingRestore': 'Âncora: aguardando sessão XR (restaurar)',
  'anchor.active': 'Âncora: ativa',
  'anchor.activeRestored': 'Âncora: ativa (restaurada)',

  'sticker.sub': 'AprilTag tag36h11 • id {value}',

  'camera.eyebrow': 'CÂMERA DA PORTA — SIMULADA',
  'camera.text': 'Sem feed real (v1)',
  'camera.sub': 'A câmera é um placeholder. O feed real entra numa versão futura.',
  'camera.close': 'Fechar câmera',

  'settings.title': 'Configurações',
  'settings.language': 'Idioma',
};

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, 'pt-BR': ptBR };

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'pt-BR';
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
  if (locale === currentLocale) return;
  currentLocale = locale;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Persistence is best effort; the in-memory locale still applies.
  }
  listeners.forEach((fn) => fn(locale));
}

export function subscribeLocale(fn: (locale: Locale) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Translate a key in the current locale; `{value}` is replaced when given. */
export function t(key: MessageKey, value?: string | number): string {
  const template = MESSAGES[currentLocale][key];
  return value === undefined ? template : template.replace('{value}', String(value));
}
