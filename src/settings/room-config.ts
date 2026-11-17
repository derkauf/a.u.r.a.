/**
 * A.U.R.A. v1 — Room configuration export / import (local-first).
 *
 * The exported JSON carries the language, "Follow my view", every setting,
 * and the device bindings and states. It never leaves the device unless
 * the user moves the file. What it cannot carry: the persistent spatial
 * anchor itself. OpenXR anchors belong to the headset that created them,
 * so on another headset the tags still need one scan to place the room.
 */
import { deviceRegistry } from '../devices/device-registry.js';
import { getLocale, setLocale } from '../i18n/i18n.js';
import { getSettings, replaceSettings } from './settings-store.js';
import { isViewFollowOn, setViewFollow } from '../ui/view-follow.js';

export const ROOM_CONFIG_FORMAT = 'aura-room-config';
export const ROOM_CONFIG_VERSION = 1;

export interface RoomConfig {
  format: typeof ROOM_CONFIG_FORMAT;
  version: number;
  exportedAt: string;
  locale: string;
  followView: boolean;
  settings: unknown;
  devices: ReturnType<typeof deviceRegistry.exportSnapshot>;
}

export function buildRoomConfig(): RoomConfig {
  return {
    format: ROOM_CONFIG_FORMAT,
    version: ROOM_CONFIG_VERSION,
    exportedAt: new Date().toISOString(),
    locale: getLocale(),
    followView: isViewFollowOn(),
    settings: getSettings(),
    devices: deviceRegistry.exportSnapshot(),
  };
}

/** Download the room configuration as a JSON file (saved to Downloads). */
export function exportRoomConfig(): void {
  const json = JSON.stringify(buildRoomConfig(), null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `aura-room-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Apply an exported room configuration. Throws on a file that is not one. */
export function importRoomConfig(json: string): void {
  const config = JSON.parse(json) as Partial<RoomConfig>;
  if (config.format !== ROOM_CONFIG_FORMAT) throw new Error('Not an A.U.R.A. room file');
  replaceSettings(config.settings);
  if (typeof config.locale === 'string') setLocale(config.locale);
  if (typeof config.followView === 'boolean') setViewFollow(config.followView);
  if (config.devices) deviceRegistry.importSnapshot(config.devices);
}
