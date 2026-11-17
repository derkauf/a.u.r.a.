/**
 * A.U.R.A. v1 — Hover scale (the Horizon OS app-icon effect).
 *
 * When the ray (or the hand cursor) enters a tag icon or the gear button,
 * the element scales up a little; when it leaves, it scales back. The
 * scale eases toward its target every frame instead of jumping.
 *
 * Hysteresis: growing moves the icon's edge, so a ray near the edge could
 * leave, shrink, re-enter, grow… and pulse. A leave only shrinks the icon
 * after the ray has stayed out for LEAVE_DELAY_MS.
 *
 * The listeners go on the document's root element, so the whole icon
 * (tile + label) reacts as one. No allocation in update(): each target
 * keeps its own reusable properties object.
 */
import { createSystem, UIKitMLAsset } from '@iwsdk/core';

/** Scene nodes that get the effect (see public/scenes/main.iwsdk.scene.json). */
const HOVER_NODE_IDS = ['sticker-lamp', 'sticker-ac', 'sticker-lock', 'settings-gear', 'scan-button'] as const;
const HOVER_SCALE = 1.2;
/** Fraction of the remaining distance covered per second (frame-rate independent). */
const EASE_PER_SECOND = 14;
const EPSILON = 0.001;
const LEAVE_DELAY_MS = 150;

interface HoverTarget {
  asset: UIKitMLAsset;
  current: number;
  target: number;
  /** When a pending leave takes effect (0 = no pending leave). */
  leaveAt: number;
  props: { transformScaleX: number; transformScaleY: number };
}

export class AuraHoverScaleSystem extends createSystem() {
  private targets = new Map<string, HoverTarget>();

  update(delta: number): void {
    if (this.targets.size < HOVER_NODE_IDS.length) this.tryBind();

    const k = 1 - Math.exp(-EASE_PER_SECOND * delta);
    const now = performance.now();
    for (const entry of this.targets.values()) {
      if (entry.leaveAt !== 0 && now >= entry.leaveAt) {
        entry.leaveAt = 0;
        entry.target = 1;
      }
      const gap = entry.target - entry.current;
      if (Math.abs(gap) < EPSILON) {
        if (entry.current === entry.target) continue;
        entry.current = entry.target;
      } else {
        entry.current += gap * k;
      }
      entry.props.transformScaleX = entry.current;
      entry.props.transformScaleY = entry.current;
      entry.asset.document.rootElement.setProperties(entry.props);
    }
  }

  private tryBind(): void {
    for (const nodeId of HOVER_NODE_IDS) {
      if (this.targets.has(nodeId)) continue;
      const asset = this.world.getSceneObject<UIKitMLAsset>(nodeId);
      if (!asset) continue;
      const entry: HoverTarget = {
        asset,
        current: 1,
        target: 1,
        leaveAt: 0,
        props: { transformScaleX: 1, transformScaleY: 1 },
      };
      this.targets.set(nodeId, entry);
      const root = asset.document.rootElement;
      const enter = (): void => {
        entry.leaveAt = 0;
        entry.target = HOVER_SCALE;
      };
      const leave = (): void => {
        entry.leaveAt = performance.now() + LEAVE_DELAY_MS;
      };
      root.addEventListener('pointerenter', enter);
      root.addEventListener('pointerleave', leave);
      this.cleanupFuncs.push(() => {
        root.removeEventListener('pointerenter', enter);
        root.removeEventListener('pointerleave', leave);
      });
    }
  }
}
