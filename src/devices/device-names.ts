/**
 * A.U.R.A. v1 — Device display names.
 *
 * There is no keyboard inside an immersive session, so "Rename" cycles
 * through localized suggestions per device type: index 0 is the default
 * name, 1…3 are suggestions (src/locales/*.json, keys name.<type>.<n>).
 * The chosen index persists in the settings store.
 */
import { t, type MessageKey } from '../i18n/i18n.js';
import type { DeviceId } from '../markers/apriltag-handshake.js';
import { getSettings, setDeviceNameIndex } from '../settings/settings-store.js';

const NAME_KEYS: Record<DeviceId, readonly MessageKey[]> = {
  'lamp-sala-01': ['device.lamp.title', 'name.lamp.1', 'name.lamp.2', 'name.lamp.3'],
  'ac-sala-01': ['device.ac.title', 'name.ac.1', 'name.ac.2', 'name.ac.3'],
  'lock-porta-01': ['device.lock.title', 'name.lock.1', 'name.lock.2', 'name.lock.3'],
};

/** The device's current display name, in the current locale. */
export function deviceDisplayName(deviceId: DeviceId): string {
  const keys = NAME_KEYS[deviceId];
  const index = getSettings().deviceNames[deviceId] ?? 0;
  return t(keys[index] ?? keys[0]);
}

/** Pick the next suggested name (wraps back to the default). */
export function cycleDeviceName(deviceId: DeviceId): void {
  const count = NAME_KEYS[deviceId].length;
  const index = getSettings().deviceNames[deviceId] ?? 0;
  setDeviceNameIndex(deviceId, (index + 1) % count);
}
