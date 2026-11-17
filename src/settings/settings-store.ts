/**
 * A.U.R.A. v1 — Settings store (local-first).
 *
 * One typed settings object, persisted in localStorage under
 * `aura_settings_v1`, with defaults for every field. Nothing leaves the
 * device: there is no cloud sync. Systems read with getSettings() and
 * re-render on subscribeSettings(); writes go through updateSettings().
 *
 * Language and "Follow my view" keep their own keys (src/i18n/i18n.ts and
 * src/ui/view-follow.ts), as they did before this store existed.
 *
 * Some fields are stored ahead of their feature (marked "next" below), so
 * the saved format does not change when those features land.
 */
import type { DeviceId } from '../markers/apriltag-handshake.js';

export const SETTINGS_STORAGE_KEY = 'aura_settings_v1';

export type CardSize = 'S' | 'M' | 'L';
export type HudMode = 'soft' | 'deeper';
export type Posture = 'standing' | 'seated';

export interface AuraSettings {
  interaction: {
    /** 0 (light) … 100 (firm grip): when a control fires (see ui/activation.ts). */
    pinchSensitivity: number;
    /** 0 … 100: how far the cursor is pulled to the hovered control's center. */
    snapStrength: number;
    /** Degrees around the gaze for a tag card to light up (90 = always). */
    activationRange: number;
    /** Reserved for a future version; always off for now. */
    headNod: boolean;
  };
  hud: {
    /** Overlay opacity in percent (40 … 100). */
    opacity: number;
    cardSize: CardSize;
    /** next: 'deeper' = holographic cyan theme. */
    mode: HudMode;
    telemetry: boolean;
    /** next */
    darkMode: boolean;
  };
  audio: {
    /** next */
    spatialVolume: number;
    /** Confirmation sound volume in percent (0 … 100). */
    confirmVolume: number;
    /** next: glow on a successful gesture. */
    feedbackIntensity: number;
  };
  comfort: {
    posture: Posture;
    /** next */
    colorblind: boolean;
    /** next */
    highContrast: boolean;
  };
  /** Chosen name per device: 0 = the default name, 1…3 = suggestions. */
  deviceNames: Partial<Record<DeviceId, number>>;
}

export const DEFAULT_SETTINGS: AuraSettings = {
  interaction: { pinchSensitivity: 25, snapStrength: 50, activationRange: 60, headNod: false },
  hud: { opacity: 100, cardSize: 'M', mode: 'soft', telemetry: false, darkMode: true },
  audio: { spatialVolume: 70, confirmVolume: 60, feedbackIntensity: 60 },
  comfort: { posture: 'standing', colorblind: false, highContrast: false },
  deviceNames: {},
};

type Section = Exclude<keyof AuraSettings, 'deviceNames'>;

function clone(settings: AuraSettings): AuraSettings {
  return JSON.parse(JSON.stringify(settings)) as AuraSettings;
}

/** Merge a stored or imported object onto the defaults (unknown fields are ignored). */
export function mergeSettings(raw: unknown): AuraSettings {
  const merged = clone(DEFAULT_SETTINGS);
  if (!raw || typeof raw !== 'object') return merged;
  const source = raw as Record<string, unknown>;
  for (const section of ['interaction', 'hud', 'audio', 'comfort'] as Section[]) {
    const value = source[section];
    if (!value || typeof value !== 'object') continue;
    const target = merged[section] as unknown as Record<string, unknown>;
    for (const [key, fieldValue] of Object.entries(value as Record<string, unknown>)) {
      if (key in target && typeof fieldValue === typeof target[key]) target[key] = fieldValue;
    }
  }
  if (source.deviceNames && typeof source.deviceNames === 'object') {
    for (const [id, index] of Object.entries(source.deviceNames as Record<string, unknown>)) {
      if (typeof index === 'number') merged.deviceNames[id as DeviceId] = index;
    }
  }
  merged.interaction.headNod = false; // reserved
  return merged;
}

function readStored(): AuraSettings {
  try {
    if (typeof localStorage === 'undefined') return clone(DEFAULT_SETTINGS);
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return mergeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return clone(DEFAULT_SETTINGS);
  }
}

let current: AuraSettings = readStored();
const listeners = new Set<(settings: AuraSettings) => void>();

function persistAndNotify(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Persistence is best effort; the in-memory settings still apply.
  }
  listeners.forEach((fn) => fn(current));
}

export function getSettings(): Readonly<AuraSettings> {
  return current;
}

/** Update one section's fields (shallow merge), persist and notify. */
export function updateSettings<S extends Section>(section: S, patch: Partial<AuraSettings[S]>): void {
  current = { ...current, [section]: { ...current[section], ...patch } };
  persistAndNotify();
}

export function setDeviceNameIndex(deviceId: DeviceId, index: number): void {
  current = { ...current, deviceNames: { ...current.deviceNames, [deviceId]: index } };
  persistAndNotify();
}

/** Replace everything (import). */
export function replaceSettings(raw: unknown): void {
  current = mergeSettings(raw);
  persistAndNotify();
}

export function subscribeSettings(fn: (settings: AuraSettings) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
