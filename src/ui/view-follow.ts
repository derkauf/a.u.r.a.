/**
 * A.U.R.A. v1 — "Follow my view" preference (HUD mode).
 *
 * On (default): the tag icons, the gear and the windows behave like a HUD
 * over the passthrough. They stay centered in front of the user and catch
 * up with a small delay when the head turns away (AuraHudFollowSystem).
 * Off: everything returns to its place in the room, and bound device
 * windows go back to the persistent anchor (the Phase 1 behavior).
 *
 * Toggled from the Settings window; the choice persists in localStorage.
 */

export const VIEW_FOLLOW_STORAGE_KEY = 'aura_view_follow';

function readStored(): boolean {
  try {
    if (typeof localStorage === 'undefined') return true;
    const stored = localStorage.getItem(VIEW_FOLLOW_STORAGE_KEY);
    return stored === null ? true : stored === 'on';
  } catch {
    return true;
  }
}

let following = readStored();
const listeners = new Set<(on: boolean) => void>();

export function isViewFollowOn(): boolean {
  return following;
}

export function setViewFollow(on: boolean): void {
  if (on === following) return;
  following = on;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(VIEW_FOLLOW_STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Persistence is best effort; the in-memory value still applies.
  }
  listeners.forEach((fn) => fn(on));
}

export function subscribeViewFollow(fn: (on: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
