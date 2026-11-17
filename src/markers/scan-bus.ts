/**
 * Phase 3: "a registered tag was read by the camera".
 *
 * The Tag scanner emits it when the camera reads a printed AprilTag whose
 * number is in the tag table (apriltag-handshake.ts); AuraPanelSystem
 * listens and loads that device: registers it (first time) and opens its
 * window with its controls. Kept apart so neither system imports the other.
 */
import type { DeviceId } from './apriltag-handshake.js';

type Listener = (deviceId: DeviceId) => void;
const listeners = new Set<Listener>();

export function emitTagScanned(deviceId: DeviceId): void {
  for (const listener of listeners) listener(deviceId);
}

export function subscribeTagScanned(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
