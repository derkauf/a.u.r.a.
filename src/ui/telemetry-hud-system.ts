/**
 * Telemetry line pinned to the view: centered, near the top edge of the
 * field of view, always drawn on top of the windows.
 *
 * Before, it sat in the HUD rig under the gear and open windows hid it.
 * It is tiny and not interactive, so it is the one A.U.R.A. element that
 * is head-locked: parented to the head, TELEMETRY_UP_DEG above the line of
 * sight at TELEMETRY_DISTANCE_M, tilted to face the eye, with depth test
 * off and a high render order so nothing covers it. Its visibility and
 * text stay with AuraAppearanceSystem (Settings › HUD & Visual › Telemetry).
 */
import { createSystem, type UIKitMLAsset } from '@iwsdk/core';

const TELEMETRY_NODE_ID = 'telemetry';
const TELEMETRY_DISTANCE_M = 0.6;
/** Degrees above the line of sight (Quest 3 shows ~48° up; this stays inside). */
const TELEMETRY_UP_DEG = 15;
const RENDER_ON_TOP = 1000;

export class AuraTelemetryHudSystem extends createSystem() {
  private placed = false;

  update(): void {
    if (this.placed) {
      // Re-attach if something moved it (e.g. a scene reload).
      const object = this.world.getSceneObject<UIKitMLAsset>(TELEMETRY_NODE_ID);
      const head = this.world.playerHeadEntity.object3D;
      if (object && head && object.parent !== head) this.placed = false;
      if (this.placed) return;
    }
    const telemetry = this.world.getSceneObject<UIKitMLAsset>(TELEMETRY_NODE_ID);
    const head = this.world.playerHeadEntity.object3D;
    if (!telemetry || !head) return;
    const up = (TELEMETRY_UP_DEG * Math.PI) / 180;
    head.add(telemetry);
    telemetry.position.set(0, Math.tan(up) * TELEMETRY_DISTANCE_M, -TELEMETRY_DISTANCE_M);
    // A UIKit panel faces +Z; tilt it about X so it faces the eye.
    telemetry.rotation.set(up, 0, 0);
    telemetry.document.rootElement.setProperties({ depthTest: false, renderOrder: RENDER_ON_TOP });
    this.placed = true;
  }
}
