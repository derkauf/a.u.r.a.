/**
 * Phase 3: where a device window goes when its printed tag is read.
 *
 * Principle (marker AR, see docs/dev-notes Part 5): the camera reads the
 * tag, and the device's window appears in front of the physical tag, facing
 * the user. The tag's position comes from the camera image:
 *
 * - direction: the tag's center in the image, through a pinhole camera
 *   model (focal length FOCAL_RATIO × image width), turned into the world by
 *   the head pose at the moment of the read;
 * - distance: the printed size (TAG_SIZE_M) against the tag's size in the
 *   image (similar triangles).
 *
 * Approximations, tuned on the Quest: the passthrough camera is treated as
 * sitting at the head with the head's orientation (it is a few cm off and
 * may be tilted); FOCAL_RATIO is an estimate for the 1280x960 headset
 * camera image. The window is placed WINDOW_GAP_M in front of the tag, so
 * small errors read as "in front of the tag".
 */
import { Quaternion, Vector3 } from '@iwsdk/core';
import type { DeviceId } from './apriltag-handshake.js';

/** Black square side of the printed tags (PDF at 100%: 111.8 mm). */
export const TAG_SIZE_M = 0.112;
/** Focal length / image width of the headset camera (estimate, ~73° horizontal). */
export const FOCAL_RATIO = 0.68;
/** The window floats this far in front of the tag, toward the user. */
export const WINDOW_GAP_M = 0.12;

export interface ImagePoint {
  x: number;
  y: number;
}

/**
 * World position of a tag seen in the camera image.
 * `corners` in image pixels; `headPos`/`headQuat` = head pose at capture.
 */
export function tagWorldPosition(
  corners: ReadonlyArray<ImagePoint>,
  imageWidth: number,
  imageHeight: number,
  headPos: Vector3,
  headQuat: Quaternion,
  out: Vector3,
): Vector3 {
  let cx = 0;
  let cy = 0;
  let side = 0;
  for (let i = 0; i < 4; i++) {
    const a = corners[i]!;
    const b = corners[(i + 1) % 4]!;
    cx += a.x / 4;
    cy += a.y / 4;
    side += Math.hypot(b.x - a.x, b.y - a.y) / 4;
  }
  const focal = FOCAL_RATIO * imageWidth;
  const depth = side > 0 ? (TAG_SIZE_M * focal) / side : 1;
  // Camera space (three.js): +x right, +y up, -z forward.
  out.set(((cx - imageWidth / 2) / focal) * depth, (-(cy - imageHeight / 2) / focal) * depth, -depth);
  return out.applyQuaternion(headQuat).add(headPos);
}

/**
 * Pose of a window in front of a tag: WINDOW_GAP_M from the tag toward the
 * head, upright, turned (yaw only) to face the head.
 */
export function windowPoseInFront(
  tagPos: Vector3,
  headPos: Vector3,
  outPos: Vector3,
  outQuat: Quaternion,
): void {
  const dx = headPos.x - tagPos.x;
  const dz = headPos.z - tagPos.z;
  const flat = Math.hypot(dx, dz) || 1;
  const gap = Math.min(WINDOW_GAP_M, flat * 0.5);
  outPos.set(tagPos.x + (dx / flat) * gap, tagPos.y, tagPos.z + (dz / flat) * gap);
  // A UIKit panel faces +Z: yaw it so +Z points at the head.
  const yaw = Math.atan2(dx, dz);
  outQuat.set(0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2));
}

/** Reads that move the target less than this are camera noise and ignored. */
export const DEADBAND_M = 0.015;
/** Each read moves the target this fraction toward the new measurement. */
const READ_BLEND = 0.35;
/** How fast the shown pose eases toward the target (per second). */
const EASE_PER_SECOND = 6;

/**
 * Window pose per device (memory only for now). `position`/`quaternion`
 * are what is shown; `target*` is the filtered measurement. Reads arrive
 * ~5 per second; the shown pose eases toward the target every frame
 * (stepPlacements), so the window glides instead of jumping.
 */
export interface Placement {
  position: Vector3;
  quaternion: Quaternion;
  targetPosition: Vector3;
  targetQuaternion: Quaternion;
}
const placements = new Map<DeviceId, Placement>();

export function setPlacement(deviceId: DeviceId, position: Vector3, quaternion: Quaternion): void {
  const current = placements.get(deviceId);
  if (!current) {
    placements.set(deviceId, {
      position: position.clone(),
      quaternion: quaternion.clone(),
      targetPosition: position.clone(),
      targetQuaternion: quaternion.clone(),
    });
    return;
  }
  if (current.targetPosition.distanceTo(position) < DEADBAND_M) return;
  current.targetPosition.lerp(position, READ_BLEND);
  current.targetQuaternion.slerp(quaternion, READ_BLEND);
}

/** Eases every shown pose toward its target. Call once per frame. */
export function stepPlacements(delta: number): void {
  const k = 1 - Math.exp(-EASE_PER_SECOND * delta);
  for (const p of placements.values()) {
    p.position.lerp(p.targetPosition, k);
    p.quaternion.slerp(p.targetQuaternion, k);
  }
}

export function getPlacement(deviceId: DeviceId): Placement | undefined {
  return placements.get(deviceId);
}

export function clearPlacement(deviceId: DeviceId): void {
  placements.delete(deviceId);
}

/** Scene node of each device window (public/scenes/main.iwsdk.scene.json). */
export const PANEL_NODE_BY_DEVICE: Record<DeviceId, string> = {
  'lamp-sala-01': 'panel-lamp',
  'ac-sala-01': 'panel-ac',
  'lock-porta-01': 'panel-lock',
  'tv-sala-01': 'panel-tv',
};
