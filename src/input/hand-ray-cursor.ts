/**
 * A.U.R.A. v1 — Ray cursor with an adjustable magnetic snap and a trail.
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
 * Motion (polished 17/11 after the Quest test: "the snap circle traveling
 * from the hand to the tag is great, it needs more fluid motion and a
 * gradient trail to guide the eye"):
 * - the cursor always eases toward its target, in both directions (it used
 *   to jump back to the fingertip): slower on long trips (TRAVEL_PER_SECOND)
 *   so the eye can follow, fast when tracking near the target;
 * - size and color blend between resting (cyan) and snapped (amber);
 * - a ribbon trail follows it: TRAIL_POINTS recent positions, tapering and
 *   fading out, colored like the cursor. When the cursor is still the
 *   ribbon collapses onto it and disappears by itself.
 *
 * The hit is tracked by state (enter/move/leave per panel), not by a
 * timeout: pointermove only arrives while the ray moves, so a still hand
 * keeps its hit.
 *
 * No allocation per frame: vectors, colors and the trail buffers are class
 * fields; pointer events copy into them.
 */
import {
  BufferAttribute,
  BufferGeometry,
  Color,
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

const CURSOR_REST_COLOR = 0x62e2ef; // cyan = resting (docs/ux/VISUAL_ID.md)
const CURSOR_SNAP_COLOR = 0xffb850; // amber = active
const SURFACE_OFFSET_M = 0.006; // toward the user, avoids z-fighting
/** Easing rate (per second) when the target is near: tight tracking. */
const TRACK_PER_SECOND = 28;
/** Easing rate on long trips (hand ↔ UI): slow enough to read the motion. */
const TRAVEL_PER_SECOND = 9;
/** A target farther than this is a "trip". */
const TRAVEL_DISTANCE_M = 0.06;
/** How fast size and color blend between resting and snapped. */
const STATE_PER_SECOND = 14;
const SNAP_SCALE = 1.4;
/** Trail: number of recent positions and the ribbon's width at the head. */
const TRAIL_POINTS = 18;
const TRAIL_WIDTH_M = 0.012;
const TRAIL_HEAD_ALPHA = 0.75;

/** Panels whose pointer events drive the cursor (scene node ids). */
const CURSOR_NODE_IDS = [
  'sticker-lamp',
  'sticker-ac',
  'sticker-lock',
  'sticker-tv',
  'settings-gear',
  'scan-button',
  'settings',
  'tag-scanner',
  'panel-lamp',
  'panel-ac',
  'panel-lock',
  'panel-tv',
  'camera-placeholder',
] as const;

interface PointerLikeEvent {
  point?: Vector3;
  target?: Object3D;
}

export class AuraCursorSystem extends createSystem() {
  private cursorGroup: Group | null = null;
  private ringMaterial: MeshBasicMaterial | null = null;
  private dotMaterial: MeshBasicMaterial | null = null;
  private bound = new Set<string>();

  // Latest UI hit (from pointer events) — copied, never allocated per frame.
  private hitPoint = new Vector3();
  /** The panel root the ray is over, or null when it is off the UI. */
  private hitRoot: Object3D | null = null;
  private hitControl: Object3D | null = null;
  private hasPosition = false;
  /** 0 = resting (cyan, small), 1 = snapped (amber, large). */
  private snap = 0;

  private tmpPos = new Vector3();
  private tmpHead = new Vector3();
  private tmpDir = new Vector3();
  private tmpCenter = new Vector3();
  private tmpSide = new Vector3();
  private restColor = new Color(CURSOR_REST_COLOR);
  private snapColor = new Color(CURSOR_SNAP_COLOR);
  private color = new Color(CURSOR_REST_COLOR);

  // Trail ribbon: TRAIL_POINTS positions → 2 vertices each.
  private trail: Vector3[] = [];
  private trailPositions = new Float32Array(TRAIL_POINTS * 2 * 3);
  private trailColors = new Float32Array(TRAIL_POINTS * 2 * 4);
  private trailGeometry: BufferGeometry | null = null;
  private trailMesh: Mesh | null = null;

  init(): void {
    const ring = new Mesh(
      new RingGeometry(0.012, 0.016, 32),
      new MeshBasicMaterial({ color: CURSOR_REST_COLOR, transparent: true, opacity: 0.95, side: DoubleSide }),
    );
    this.ringMaterial = ring.material as MeshBasicMaterial;
    const dot = new Mesh(new SphereGeometry(0.004, 16, 12), new MeshBasicMaterial({ color: CURSOR_REST_COLOR }));
    this.dotMaterial = dot.material as MeshBasicMaterial;
    const group = new Group();
    group.add(ring);
    group.add(dot);
    group.visible = false;
    this.cursorGroup = group;
    this.world.createTransformEntity(group);

    // Trail ribbon (world space, rebuilt in place every frame).
    for (let i = 0; i < TRAIL_POINTS; i++) this.trail.push(new Vector3());
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(this.trailPositions, 3));
    geometry.setAttribute('color', new BufferAttribute(this.trailColors, 4));
    const index: number[] = [];
    for (let i = 0; i < TRAIL_POINTS - 1; i++) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geometry.setIndex(index);
    this.trailGeometry = geometry;
    const trail = new Mesh(
      geometry,
      new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide }),
    );
    trail.frustumCulled = false;
    trail.visible = false;
    this.trailMesh = trail;
    this.world.createTransformEntity(trail);
  }

  update(delta: number): void {
    if (this.bound.size < CURSOR_NODE_IDS.length) this.tryBind();
    const cursor = this.cursorGroup;
    if (!cursor) return;
    // No XR session, no hand ray: cursor hidden.
    if (this.world.xrSession === undefined) {
      cursor.visible = false;
      if (this.trailMesh) this.trailMesh.visible = false;
      this.hasPosition = false;
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

    if (!this.hasPosition) {
      cursor.position.copy(this.tmpPos);
      for (const p of this.trail) p.copy(this.tmpPos);
      this.hasPosition = true;
    } else {
      // Ease in both directions; slower on long trips so the eye can follow.
      const far = cursor.position.distanceTo(this.tmpPos) > TRAVEL_DISTANCE_M;
      const rate = far ? TRAVEL_PER_SECOND : onUi ? TRACK_PER_SECOND : TRAVEL_PER_SECOND * 1.6;
      cursor.position.lerp(this.tmpPos, 1 - Math.exp(-rate * delta));
    }
    cursor.lookAt(this.tmpHead); // billboard toward the user

    // Size and color blend between resting and snapped.
    const targetSnap = control ? 1 : 0;
    this.snap += (targetSnap - this.snap) * (1 - Math.exp(-STATE_PER_SECOND * delta));
    cursor.scale.setScalar(1 + (SNAP_SCALE - 1) * this.snap);
    this.color.copy(this.restColor).lerp(this.snapColor, this.snap);
    this.ringMaterial?.color.copy(this.color);
    this.dotMaterial?.color.copy(this.color);

    this.updateTrail(cursor.position);
  }

  /** Shift the trail, then rebuild the ribbon facing the user. */
  private updateTrail(head: Vector3): void {
    const mesh = this.trailMesh;
    const geometry = this.trailGeometry;
    if (!mesh || !geometry) return;
    // Recycle the oldest point as the new head (no allocation).
    const recycled = this.trail.pop()!;
    recycled.copy(head);
    this.trail.unshift(recycled);

    let length = 0;
    for (let i = 0; i < TRAIL_POINTS; i++) {
      const p = this.trail[i]!;
      const next = this.trail[Math.min(i + 1, TRAIL_POINTS - 1)]!;
      const prev = this.trail[Math.max(i - 1, 0)]!;
      if (i > 0) length += p.distanceTo(prev);
      // Ribbon side = segment direction × view direction.
      this.tmpDir.copy(prev).sub(next);
      this.tmpCenter.copy(this.tmpHead).sub(p);
      this.tmpSide.crossVectors(this.tmpDir, this.tmpCenter);
      if (this.tmpSide.lengthSq() < 1e-12) this.tmpSide.set(0, 0, 0);
      else this.tmpSide.normalize();
      const t = i / (TRAIL_POINTS - 1); // 0 at the head, 1 at the tail
      const half = (TRAIL_WIDTH_M * (1 - t)) / 2;
      const v = i * 6;
      this.trailPositions[v] = p.x + this.tmpSide.x * half;
      this.trailPositions[v + 1] = p.y + this.tmpSide.y * half;
      this.trailPositions[v + 2] = p.z + this.tmpSide.z * half;
      this.trailPositions[v + 3] = p.x - this.tmpSide.x * half;
      this.trailPositions[v + 4] = p.y - this.tmpSide.y * half;
      this.trailPositions[v + 5] = p.z - this.tmpSide.z * half;
      const alpha = TRAIL_HEAD_ALPHA * (1 - t) * (1 - t);
      const c = i * 8;
      for (let k = 0; k < 2; k++) {
        this.trailColors[c + k * 4] = this.color.r;
        this.trailColors[c + k * 4 + 1] = this.color.g;
        this.trailColors[c + k * 4 + 2] = this.color.b;
        this.trailColors[c + k * 4 + 3] = alpha;
      }
    }
    // A still cursor has no trail.
    mesh.visible = length > 0.01;
    geometry.attributes.position!.needsUpdate = true;
    geometry.attributes.color!.needsUpdate = true;
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
