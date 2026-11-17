/**
 * A.U.R.A. v1 — Ray cursor with an adjustable magnetic snap.
 *
 * A ring + center dot that shows where the ray actually hits the UI:
 * - over a panel: at the exact hit point (from the UI's pointer events), so
 *   what the user aims at is what the press will hit;
 * - over a control (any element wired through ui/activation.ts): pulled
 *   from the hit point toward the control's center by the magnetic snap
 *   strength (Settings › Interaction: 0 = exact hit, 100 = center), grows
 *   and turns amber — the press will land there;
 * - away from the UI: rests on the right index fingertip.
 *
 * Earlier versions snapped to the center of the whole panel node, which
 * showed the cursor far from the button actually under the ray.
 *
 * The hit is tracked by state (enter/move/leave per panel), not by a
 * timeout: pointermove only arrives while the ray moves, so a still hand
 * keeps its hit. The cursor eases toward its target to remove jitter.
 *
 * No allocation per frame: vectors are class fields; pointer events copy
 * into them.
 */
import {
  createSystem,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SphereGeometry,
  UIKitMLAsset,
  Vector3,
  type Object3D,
} from '@iwsdk/core';
import { interactiveElements } from '../ui/activation.js';
import { getSettings } from '../settings/settings-store.js';

const CURSOR_REST_COLOR = 0xffffff;
const CURSOR_SNAP_COLOR = 0xffc107; // amber
const SURFACE_OFFSET_M = 0.006; // toward the user, avoids z-fighting
/** Fraction of the remaining distance covered per second (smoothing). */
const FOLLOW_PER_SECOND = 30;

/** Panels whose pointer events drive the cursor (scene node ids). */
const CURSOR_NODE_IDS = [
  'sticker-lamp',
  'sticker-ac',
  'sticker-lock',
  'settings-gear',
  'settings',
  'panel-lamp',
  'panel-ac',
  'panel-lock',
  'camera-placeholder',
] as const;

interface PointerLikeEvent {
  point?: Vector3;
  target?: Object3D;
}

export class AuraCursorSystem extends createSystem() {
  private cursorGroup: Group | null = null;
  private ringMaterial: MeshBasicMaterial | null = null;
  private bound = new Set<string>();

  // Latest UI hit (from pointer events) — copied, never allocated per frame.
  private hitPoint = new Vector3();
  /** The panel root the ray is over, or null when it is off the UI. */
  private hitRoot: Object3D | null = null;
  private hitControl: Object3D | null = null;
  private hasPosition = false;

  private tmpPos = new Vector3();
  private tmpHead = new Vector3();
  private tmpDir = new Vector3();
  private tmpCenter = new Vector3();

  init(): void {
    const ring = new Mesh(
      new RingGeometry(0.012, 0.016, 32),
      new MeshBasicMaterial({ color: CURSOR_REST_COLOR, transparent: true, opacity: 0.95, side: DoubleSide }),
    );
    this.ringMaterial = ring.material as MeshBasicMaterial;
    const dot = new Mesh(new SphereGeometry(0.004, 16, 12), new MeshBasicMaterial({ color: CURSOR_REST_COLOR }));
    const group = new Group();
    group.add(ring);
    group.add(dot);
    group.visible = false;
    this.cursorGroup = group;
    this.world.createTransformEntity(group);
  }

  update(delta: number): void {
    if (this.bound.size < CURSOR_NODE_IDS.length) this.tryBind();
    const cursor = this.cursorGroup;
    if (!cursor) return;
    // No XR session, no hand ray: cursor hidden.
    if (this.world.xrSession === undefined) {
      cursor.visible = false;
      return;
    }
    cursor.visible = true;

    this.player.head.getWorldPosition(this.tmpHead);
    const onUi = this.hitRoot !== null;
    const control = onUi ? this.hitControl : null;

    if (onUi) {
      this.tmpPos.copy(this.hitPoint);
      if (control) {
        // Magnetic snap: pull from the hit toward the control's center.
        const strength = getSettings().interaction.snapStrength / 100;
        control.getWorldPosition(this.tmpCenter);
        this.tmpPos.lerp(this.tmpCenter, strength);
      }
      this.tmpDir.copy(this.tmpHead).sub(this.tmpPos).normalize().multiplyScalar(SURFACE_OFFSET_M);
      this.tmpPos.add(this.tmpDir);
    } else {
      // Rest: right index fingertip.
      this.player.indexTipSpaces.right.getWorldPosition(this.tmpPos);
    }
    if (this.hasPosition && onUi) {
      cursor.position.lerp(this.tmpPos, 1 - Math.exp(-FOLLOW_PER_SECOND * delta));
    } else {
      cursor.position.copy(this.tmpPos);
      this.hasPosition = true;
    }
    cursor.lookAt(this.tmpHead); // billboard toward the user
    cursor.scale.setScalar(control ? 1.4 : 1);
    this.ringMaterial?.color.set(control ? CURSOR_SNAP_COLOR : CURSOR_REST_COLOR);
  }

  private tryBind(): void {
    for (const nodeId of CURSOR_NODE_IDS) {
      if (this.bound.has(nodeId)) continue;
      const asset = this.world.getSceneObject<UIKitMLAsset>(nodeId);
      if (!asset) continue;
      this.bound.add(nodeId);
      const root = asset.document.rootElement;
      const move = (event: unknown): void => this.onHit(root, event as PointerLikeEvent);
      const leave = (): void => {
        if (this.hitRoot !== root) return;
        this.hitRoot = null;
        this.hitControl = null;
      };
      root.addEventListener('pointermove', move);
      root.addEventListener('pointerover', move);
      root.addEventListener('pointerleave', leave);
      this.cleanupFuncs.push(() => {
        root.removeEventListener('pointermove', move);
        root.removeEventListener('pointerover', move);
        root.removeEventListener('pointerleave', leave);
      });
    }
  }

  /** Record the hit point and the control under it (walking up from the target). */
  private onHit(root: Object3D, event: PointerLikeEvent): void {
    if (!event.point) return;
    this.hitPoint.copy(event.point);
    this.hitRoot = root;
    let node: Object3D | null = event.target ?? null;
    while (node && !interactiveElements.has(node)) node = node.parent;
    this.hitControl = node;
  }
}
