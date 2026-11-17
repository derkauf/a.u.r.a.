/**
 * A.U.R.A. v1 — Localized device texts shared by the device windows and the
 * Settings › Devices list.
 */
import { t } from '../i18n/i18n.js';
import type { DeviceEntry } from './device-registry.js';

/** Current state in words, e.g. "On • 80%", "Locked". */
export function deviceStatusText(entry: DeviceEntry): string {
  switch (entry.deviceId) {
    case 'lamp-sala-01':
      return entry.state.power ? t('status.lamp.on', entry.state.brightness ?? 80) : t('status.lamp.off');
    case 'ac-sala-01':
      return entry.state.power ? t('status.ac.on', entry.state.setpoint_c ?? 22) : t('status.ac.off');
    case 'lock-porta-01':
      return entry.state.locked ? t('status.lock.locked') : t('status.lock.unlocked');
  }
}

/** Label of the main toggle button: the action it will perform. */
export function deviceToggleLabel(entry: DeviceEntry): string {
  if (entry.deviceId === 'lock-porta-01') return entry.state.locked ? t('action.unlock') : t('action.lock');
  return entry.state.power ? t('action.turnOff') : t('action.turnOn');
}
