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
 * camera image. The device's tag icon is laid over the paper tag (the
 * virtual tag, to point at instead of the HUD icons) and its window floats
 * above it; both turn to face the user every frame.
 */
import { Quaternion, Vector3 } from '@iwsdk/core';
import type { DeviceId } from './apriltag-handshake.js';

/** Black square side of the printed tags (PDF at 100%: 111.8 mm). */
export const TAG_SIZE_M = 0.112;
/** Focal length / image width of the headset camera (estimate, ~73° horizontal). */
export const FOCAL_RATIO = 0.68;
/**
 * The passthrough camera points this many degrees below the line of sight
 * (calibrated on the Quest 17/11: virtual tags sat ~10 cm above the paper
 * at ~1.5 m, i.e. ~4°, when the camera was treated as the eye).
 */
export const CAMERA_PITCH_DOWN_DEG = 4;
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
  // Camera tilted down: rotate about X by -pitch (y' = y·cos − z·sin with θ < 0).
  const t = (-CAMERA_PITCH_DOWN_DEG * Math.PI) / 180;
  const y = out.y * Math.cos(t) - out.z * Math.sin(t);
  const z = out.y * Math.sin(t) + out.z * Math.cos(t);
  out.y = y;
  out.z = z;
  return out.applyQuaternion(headQuat).add(headPos);
}

/** The window floats this high above the tag, so it never covers the (virtual) tag. */
export const WINDOW_RAISE_M = 0.24;
/** The virtual tag sits this far in front of the paper, so it never z-fights the wall. */
export const VIRTUAL_TAG_GAP_M = 0.01;

/**
 * Pose of something attached to a tag and facing the user: `gap` from the
 * tag toward the head (horizontally), `raise` above it, upright, turned
 * (yaw only) so its front (+Z, the UIKit panel front) points at the head.
 * Called every frame with the current head, so it keeps facing the user
 * wherever they walk.
 */
export function facingPoseAtTag(
  tagPos: Vector3,
  headPos: Vector3,
  gap: number,
  raise: number,
  outPos: Vector3,
  outQuat: Quaternion,
): void {
  const dx = headPos.x - tagPos.x;
  const dz = headPos.z - tagPos.z;
  const flat = Math.hypot(dx, dz) || 1;
  const g = Math.min(gap, flat * 0.5);
  outPos.set(tagPos.x + (dx / flat) * g, tagPos.y + raise, tagPos.z + (dz / flat) * g);
  const yaw = Math.atan2(dx, dz);
  outQuat.set(0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2));
}

/** Window pose for a tag: WINDOW_GAP_M toward the user, WINDOW_RAISE_M up. */
export function windowPoseInFront(tagPos: Vector3, headPos: Vector3, outPos: Vector3, outQuat: Quaternion): void {
  facingPoseAtTag(tagPos, headPos, WINDOW_GAP_M, WINDOW_RAISE_M, outPos, outQuat);
}

/** Reads that move the tag less than this are camera noise and ignored. */
export const DEADBAND_M = 0.015;
/** Each read moves the target this fraction toward the new measurement. */
const READ_BLEND = 0.35;
/** How fast the shown position eases toward the target (per second). */
const EASE_PER_SECOND = 6;

/**
 * Where each read tag is in the room (memory only for now). `position` is
 * what is shown; `target` is the filtered measurement. Reads arrive ~5 per
 * second; the shown position eases toward the target every frame
 * (stepPlacements), so things glide instead of jumping. Orientation is not
 * stored: what is attached to the tag turns to face the user every frame.
 */
export interface Placement {
  position: Vector3;
  target: Vector3;
}
const placements = new Map<DeviceId, Placement>();

export function setPlacement(deviceId: DeviceId, tagPosition: Vector3): void {
  const current = placements.get(deviceId);
  if (!current) {
    placements.set(deviceId, { position: tagPosition.clone(), target: tagPosition.clone() });
    return;
  }
  if (current.target.distanceTo(tagPosition) < DEADBAND_M) return;
  current.target.lerp(tagPosition, READ_BLEND);
}

/** Eases every shown position toward its target. Call once per frame. */
export function stepPlacements(delta: number): void {
  const k = 1 - Math.exp(-EASE_PER_SECOND * delta);
  for (const p of placements.values()) p.position.lerp(p.target, k);
}

export function getPlacement(deviceId: DeviceId): Placement | undefined {
  return placements.get(deviceId);
}

export function clearPlacement(deviceId: DeviceId): void {
  placements.delete(deviceId);
}

/** Every virtual tag back to the HUD row (Settings › Devices › Return tags to HUD). */
export function clearAllPlacements(): void {
  placements.clear();
}

/** Scene node of each device window (public/scenes/main.iwsdk.scene.json). */
export const PANEL_NODE_BY_DEVICE: Record<DeviceId, string> = {
  'lamp-sala-01': 'panel-lamp',
  'ac-sala-01': 'panel-ac',
  'lock-porta-01': 'panel-lock',
  'tv-sala-01': 'panel-tv',
};

/** Scene node of each device's tag icon: it becomes the virtual tag over the paper. */
export const STICKER_NODE_BY_DEVICE: Record<DeviceId, string> = {
  'lamp-sala-01': 'sticker-lamp',
  'ac-sala-01': 'sticker-ac',
  'lock-porta-01': 'sticker-lock',
  'tv-sala-01': 'sticker-tv',
};

/**
 * Scale of a tag icon placed over its paper tag: the icon's 8x8 black grid
 * is 64 UIKit units (cm) wide, so this makes it TAG_SIZE_M wide.
 */
export const VIRTUAL_TAG_SCALE = TAG_SIZE_M / 0.64;
/**
 * The icon's root is centered on tile + label; the tile center is this many
 * units above it (icon 140 wide: tile 96, gap 8, label ~22 → (126 - 96) / 2).
 */
export const VIRTUAL_TAG_TILE_OFFSET_UNITS = 15;
