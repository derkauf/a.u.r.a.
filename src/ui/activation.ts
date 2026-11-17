/**
 * A.U.R.A. v1 — Button activation with adjustable pinch sensitivity.
 *
 * A plain click only counts when the ray is over the same button at press
 * and at release. A hand pinch moves the hand ray while the fingers close,
 * so clicks get lost. Every A.U.R.A. control activates through onActivate(),
 * and Settings › Interaction › Pinch sensitivity picks when it fires:
 *
 * - Light (0–33): on press — the instant the pinch (or trigger) starts.
 *   Drift during the gesture cannot lose it. Default.
 * - Medium (34–66): on release anywhere on the same panel, within 1 s of
 *   the press (forgives drift onto a neighbouring element).
 * - Firm (67–100): a strict click — press and release on the same button.
 *
 * Elements registered here are also what the cursor's magnetic snap pulls
 * toward (see hand-ray-cursor.ts).
 */
import type { Object3D } from '@iwsdk/core';
import { getSettings } from '../settings/settings-store.js';

export type PinchMode = 'light' | 'medium' | 'firm';

/** Every element that activates through onActivate (for the cursor snap). */
export const interactiveElements = new WeakSet<Object3D>();

const MEDIUM_RELEASE_WINDOW_MS = 1000;

export function pinchMode(sensitivity = getSettings().interaction.pinchSensitivity): PinchMode {
  if (sensitivity <= 33) return 'light';
  if (sensitivity <= 66) return 'medium';
  return 'firm';
}

/** Minimal shape of a UIKit element (an Object3D with DOM-like events). */
type Activatable = Object3D & {
  addEventListener(type: string, listener: (event: unknown) => void): void;
  removeEventListener(type: string, listener: (event: unknown) => void): void;
};

/** A press waiting for its release (medium mode), shared across elements. */
let pendingPress: { handler: () => void; root: Object3D; until: number } | null = null;
/** Roots that already forward releases for medium mode. */
const releaseRoots = new WeakSet<Object3D>();

/**
 * Make `element` activate `handler` according to the pinch sensitivity.
 * `root` is the panel's root element (releases anywhere on it count in
 * medium mode). Returns a function that removes the listeners.
 */
export function onActivate(element: Activatable, root: Activatable, handler: () => void): () => void {
  interactiveElements.add(element);

  const down = (): void => {
    const mode = pinchMode();
    if (mode === 'light') {
      handler();
    } else if (mode === 'medium') {
      pendingPress = { handler, root, until: performance.now() + MEDIUM_RELEASE_WINDOW_MS };
    }
  };
  const click = (): void => {
    if (pinchMode() === 'firm') handler();
  };
  element.addEventListener('pointerdown', down);
  element.addEventListener('click', click);

  if (!releaseRoots.has(root)) {
    releaseRoots.add(root);
    root.addEventListener('pointerup', () => {
      const press = pendingPress;
      pendingPress = null;
      if (press && press.root === root && performance.now() <= press.until) press.handler();
    });
  }

  return () => {
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('click', click);
  };
}
