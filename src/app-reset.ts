/**
 * "Restart app" from Settings › Devices: back to the first-run state without
 * leaving the immersive session. Settings resets the data (devices, virtual
 * tags); every system that holds open UI listens here and closes it (device
 * windows, door camera, Tag scanner). Kept apart so no system imports another.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export function emitAppReset(): void {
  for (const listener of listeners) listener();
}

export function subscribeAppReset(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
