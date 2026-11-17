/**
 * A.U.R.A. v1 — HUD follow ("Follow my view").
 *
 * When the preference is on (src/ui/view-follow.ts), every A.U.R.A. UI
 * object — the tag icons, the gear, the Settings window, the device windows
 * and the door camera — is gathered under one "rig" that follows the head
 * lazily, like a HUD: it stays put while the user looks around it and only
 * re-centers when the head turns past a threshold, then eases into place.
 *
 * Separate thresholds per axis:
 * - yaw (left/right): wide enough to look at the side tag icons (~43° off
 *   center) without the HUD moving;
 * - pitch (up/down): wide enough to look down at an open device window
 *   (~37° below) without the HUD moving; past it, the HUD follows up or
 *   down and tilts to keep facing the user;
 * - position: re-centers when the head moves away (walking, leaning).
 *
 * The authored layout is kept: each object sits in the rig at its scene
 * position relative to RIG_ORIGIN, scaled by the card size (Settings ›
 * HUD & Visual: S/M/L) — the Settings window keeps its size. Interface
 * height (Settings › Comfort: seated) lowers the HUD relative to the head,
 * and lowers the room layout when following is off.
 *
 * Device windows get an XRAnchor once their device is bound, and the SDK
 * then moves them into its anchored group. While following, this system
 * puts them back into the rig every frame, so a window never drifts away
 * from its icon.
 *
 * When the preference is off, every object returns to its original parent
 * and transform (the authored room layout), and anchored windows are
 * re-attached to the persistent anchor — the Phase 1 behavior.
 *
 * No allocation in update(): all math objects are class fields.
 */
import { createSystem, Euler, Object3D, Quaternion, Vector3, XRAnchor, type Entity } from '@iwsdk/core';
import { isViewFollowOn, subscribeViewFollow } from './view-follow.js';
import { getSettings, subscribeSettings, type CardSize } from '../settings/settings-store.js';

/** Scene nodes that form the HUD (see public/scenes/main.iwsdk.scene.json). */
const HUD_NODE_IDS = [
  'sticker-lamp',
  'sticker-ac',
  'sticker-lock',
  'settings-gear',
  'settings',
  'panel-lamp',
  'panel-ac',
  'panel-lock',
  'camera-placeholder',
  'telemetry',
] as const;

/** Nodes that keep their size whatever the card size (they must stay readable). */
const FIXED_SIZE_NODE_IDS: ReadonlySet<string> = new Set(['settings']);
const CARD_SIZE_FACTOR: Record<CardSize, number> = { S: 0.8, M: 1, L: 1.25 };
/** Seated: the HUD sits this much lower relative to the head (follow on)… */
const SEATED_FOLLOW_DROP_M = 0.08;
/** …and the room layout this much lower (follow off). */
const SEATED_ROOM_DROP_M = 0.35;

/** The authored point that becomes the rig's origin (middle tag icon). */
const RIG_ORIGIN = new Vector3(0, 1.5, -0.6);
/** Where the rig sits relative to the head: a bit below eye level, 60 cm ahead. */
const FOLLOW_OFFSET = new Vector3(0, -0.1, -0.6);
/** Head turn (degrees) left/right before the HUD re-centers. */
const YAW_THRESHOLD_DEG = 50;
/** Head turn (degrees) up/down before the HUD re-centers. */
const PITCH_THRESHOLD_DEG = 40;
/** The HUD never tilts further than this up or down. */
const MAX_PITCH_DEG = 60;
/** Head movement (metres) before the HUD re-centers. */
const POSITION_TOLERANCE_M = 0.35;
/** Fraction of the remaining distance covered per second (the follow delay). */
const EASE_PER_SECOND = 3.5;

const DEG = Math.PI / 180;

interface HudNode {
  id: string;
  object: Object3D;
  entity: Entity | undefined;
  homeParent: Object3D | null;
  homePosition: Vector3;
  homeQuaternion: Quaternion;
  homeScale: Vector3;
  rigPosition: Vector3;
}

/** Shortest signed difference between two angles, in radians. */
function angleDelta(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export class AuraHudFollowSystem extends createSystem() {
  private nodes = new Map<string, HudNode>();
  private rig!: Entity;
  private following = false;
  private needsSnap = true;

  // Follow state: where the HUD is now, and where it is heading.
  private yaw = 0;
  private pitch = 0;
  private targetYaw = 0;
  private targetPitch = 0;
  private anchorPos = new Vector3();
  private targetAnchorPos = new Vector3();

  // Scratch objects (no allocation per frame).
  private headPos = new Vector3();
  private headQuat = new Quaternion();
  private headEuler = new Euler(0, 0, 0, 'YXZ');
  private rigEuler = new Euler(0, 0, 0, 'YXZ');
  private offset = new Vector3();
  private followOffset = new Vector3();

  init(): void {
    this.rig = this.world.createTransformEntity();
    this.cleanupFuncs.push(subscribeViewFollow((on) => this.apply(on)));
    // Card size or interface height changed: re-place everything in the current mode.
    this.cleanupFuncs.push(subscribeSettings(() => this.apply(this.following, false)));
  }

  update(delta: number): void {
    if (this.nodes.size < HUD_NODE_IDS.length) {
      this.tryBind();
      if (this.nodes.size === HUD_NODE_IDS.length) this.apply(isViewFollowOn());
      return;
    }
    if (!this.following) return;
    const rigObject = this.rig.object3D;
    const head = this.world.playerHeadEntity.object3D;
    if (!rigObject || !head) return;

    // Keep every HUD object in the rig (the SDK may move bound windows
    // into its anchored group).
    for (const node of this.nodes.values()) {
      if (node.object.parent !== rigObject) this.placeInRig(node, rigObject);
    }

    head.getWorldPosition(this.headPos);
    head.getWorldQuaternion(this.headQuat);
    this.headEuler.setFromQuaternion(this.headQuat, 'YXZ');
    const headYaw = this.headEuler.y;
    const headPitch = Math.max(-MAX_PITCH_DEG * DEG, Math.min(MAX_PITCH_DEG * DEG, this.headEuler.x));

    if (this.needsSnap) {
      this.yaw = this.targetYaw = headYaw;
      this.pitch = this.targetPitch = headPitch;
      this.anchorPos.copy(this.headPos);
      this.targetAnchorPos.copy(this.headPos);
      this.needsSnap = false;
    } else {
      // Re-center an axis only after the head moves past its threshold.
      if (Math.abs(angleDelta(headYaw, this.targetYaw)) > YAW_THRESHOLD_DEG * DEG) this.targetYaw = headYaw;
      if (Math.abs(headPitch - this.targetPitch) > PITCH_THRESHOLD_DEG * DEG) this.targetPitch = headPitch;
      if (this.headPos.distanceTo(this.targetAnchorPos) > POSITION_TOLERANCE_M) {
        this.targetAnchorPos.copy(this.headPos);
      }
      const k = 1 - Math.exp(-EASE_PER_SECOND * delta);
      this.yaw += angleDelta(this.targetYaw, this.yaw) * k;
      this.pitch += (this.targetPitch - this.pitch) * k;
      this.anchorPos.lerp(this.targetAnchorPos, k);
    }

    // Place the rig in front of the (lazily followed) view, facing the user.
    this.rigEuler.set(this.pitch, this.yaw, 0, 'YXZ');
    rigObject.quaternion.setFromEuler(this.rigEuler);
    this.followOffset.copy(FOLLOW_OFFSET);
    if (getSettings().comfort.posture === 'seated') this.followOffset.y -= SEATED_FOLLOW_DROP_M;
    this.offset.copy(this.followOffset).applyQuaternion(rigObject.quaternion);
    rigObject.position.copy(this.anchorPos).add(this.offset);
  }

  private tryBind(): void {
    for (const nodeId of HUD_NODE_IDS) {
      if (this.nodes.has(nodeId)) continue;
      const object = this.world.getSceneObject(nodeId);
      if (!object) continue;
      this.nodes.set(nodeId, {
        id: nodeId,
        object,
        entity: this.world.getSceneEntity(nodeId),
        homeParent: object.parent,
        homePosition: object.position.clone(),
        homeQuaternion: object.quaternion.clone(),
        homeScale: object.scale.clone(),
        rigPosition: object.position.clone().sub(RIG_ORIGIN),
      });
    }
  }

  private apply(on: boolean, snap = true): void {
    if (this.nodes.size < HUD_NODE_IDS.length) return; // applied once all are bound
    const rigObject = this.rig.object3D;
    if (!rigObject) return;
    if (on) {
      if (snap) this.needsSnap = true;
      for (const node of this.nodes.values()) this.placeInRig(node, rigObject);
    } else {
      for (const node of this.nodes.values()) this.returnHome(node);
    }
    this.following = on;
  }

  /** Card-size factor for a node (1 for nodes that keep their size). */
  private sizeFactor(node: HudNode): number {
    return FIXED_SIZE_NODE_IDS.has(node.id) ? 1 : CARD_SIZE_FACTOR[getSettings().hud.cardSize];
  }

  private placeInRig(node: HudNode, rigObject: Object3D): void {
    const factor = CARD_SIZE_FACTOR[getSettings().hud.cardSize];
    rigObject.add(node.object);
    node.object.position.copy(node.rigPosition).multiplyScalar(factor);
    node.object.quaternion.copy(node.homeQuaternion);
    node.object.scale.copy(node.homeScale).multiplyScalar(this.sizeFactor(node));
  }

  private returnHome(node: HudNode): void {
    const factor = CARD_SIZE_FACTOR[getSettings().hud.cardSize];
    node.homeParent?.add(node.object);
    // The room layout scales around RIG_ORIGIN and drops when seated.
    node.object.position.copy(node.rigPosition).multiplyScalar(factor).add(RIG_ORIGIN);
    if (getSettings().comfort.posture === 'seated') node.object.position.y -= SEATED_ROOM_DROP_M;
    node.object.quaternion.copy(node.homeQuaternion);
    node.object.scale.copy(node.homeScale).multiplyScalar(this.sizeFactor(node));
    // A bound window goes back to the persistent anchor: the SDK re-attaches
    // it (keeping this world transform) on its next update.
    if (node.entity?.hasComponent(XRAnchor)) node.entity.setValue(XRAnchor, 'attached', false);
  }
}
