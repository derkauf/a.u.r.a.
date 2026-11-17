/**
 * A.U.R.A. v1 — Appearance: overlay opacity and telemetry.
 *
 * - Overlay opacity (Settings › HUD & Visual) is applied to the root of
 *   every HUD panel (tag icons, gear, device windows, door camera). The
 *   Settings window itself stays fully opaque so it is always readable.
 * - Telemetry shows frame rate, frame time and the anchor status under the
 *   gear, refreshed twice per second, when the setting is on.
 * - Activation range (Settings › Interaction): a tag card lights up when the
 *   gaze comes within that many degrees of it and dims to DIM_ALPHA outside
 *   it, easing between the two. 90° keeps every card lit.
 *
 * Card size and interface height are layout, applied by AuraHudFollowSystem.
 */
import { createSystem, UIKitMLAsset, Vector3 } from '@iwsdk/core';
import { anchorStatus, anchorStatusText } from '../anchors/anchor-status.js';
import { subscribeLocale, t } from '../i18n/i18n.js';
import { getSettings, subscribeSettings } from '../settings/settings-store.js';

const OPACITY_NODE_IDS = [
  'sticker-lamp',
  'sticker-ac',
  'sticker-lock',
  'settings-gear',
  'scan-button',
  'tag-scanner',
  'panel-lamp',
  'panel-ac',
  'panel-lock',
  'panel-tv',
  'camera-placeholder',
  'telemetry',
] as const;
const TELEMETRY_NODE_ID = 'telemetry';
const CARD_NODE_IDS = ['sticker-lamp', 'sticker-ac', 'sticker-lock'] as const;
const DIM_ALPHA = 0.2;
const ALWAYS_LIT_DEG = 90;
const FADE_PER_SECOND = 8;
const TELEMETRY_INTERVAL_S = 0.5;

export class AuraAppearanceSystem extends createSystem() {
  private assets = new Map<string, UIKitMLAsset>();
  private opacityProps = { opacity: 1 };
  /** Per-card gaze alpha and its reusable properties object. */
  private cards = new Map<string, { alpha: number; props: { opacity: number } }>();
  private headPos = new Vector3();
  private headDir = new Vector3();
  private cardPos = new Vector3();
  private frames = 0;
  private elapsed = 0;

  init(): void {
    this.cleanupFuncs.push(subscribeSettings(() => this.applyAll()));
    this.cleanupFuncs.push(subscribeLocale(() => this.applyAll()));
  }

  update(delta: number): void {
    if (this.assets.size < OPACITY_NODE_IDS.length) this.tryBind();
    this.updateActivationRange(delta);
    if (!getSettings().hud.telemetry) return;
    this.frames += 1;
    this.elapsed += delta;
    if (this.elapsed < TELEMETRY_INTERVAL_S) return;
    const fps = Math.round(this.frames / this.elapsed);
    const ms = ((this.elapsed / this.frames) * 1000).toFixed(1);
    this.frames = 0;
    this.elapsed = 0;
    this.assets
      .get(TELEMETRY_NODE_ID)
      ?.getElementById('telemetry-text')
      ?.setProperties({ text: `${t('tele.fps', fps)} · ${t('tele.ms', ms)} · ${anchorStatusText(anchorStatus)}` });
  }

  /** Light the tag cards near the gaze, dim the others. */
  private updateActivationRange(delta: number): void {
    const settings = getSettings();
    const overlay = settings.hud.opacity / 100;
    const range = settings.interaction.activationRange;
    const head = this.world.playerHeadEntity.object3D;
    if (!head) return;
    head.getWorldPosition(this.headPos);
    head.getWorldDirection(this.headDir).negate(); // Object3D forward is -Z
    const k = 1 - Math.exp(-FADE_PER_SECOND * delta);
    for (const nodeId of CARD_NODE_IDS) {
      const asset = this.assets.get(nodeId);
      const card = this.cards.get(nodeId);
      if (!asset || !card) continue;
      let target = 1;
      if (range < ALWAYS_LIT_DEG) {
        asset.getWorldPosition(this.cardPos).sub(this.headPos).normalize();
        const angle = (Math.acos(Math.max(-1, Math.min(1, this.cardPos.dot(this.headDir)))) * 180) / Math.PI;
        target = angle <= range ? 1 : DIM_ALPHA;
      }
      if (Math.abs(target - card.alpha) < 0.005 && card.props.opacity === card.alpha * overlay) continue;
      card.alpha += (target - card.alpha) * k;
      card.props.opacity = card.alpha * overlay;
      asset.document.rootElement.setProperties(card.props);
    }
  }

  private tryBind(): void {
    let added = false;
    for (const nodeId of OPACITY_NODE_IDS) {
      if (this.assets.has(nodeId)) continue;
      const asset = this.world.getSceneObject<UIKitMLAsset>(nodeId);
      if (!asset) continue;
      this.assets.set(nodeId, asset);
      if ((CARD_NODE_IDS as readonly string[]).includes(nodeId)) {
        this.cards.set(nodeId, { alpha: 1, props: { opacity: 1 } });
      }
      added = true;
    }
    if (added) this.applyAll();
  }

  private applyAll(): void {
    const settings = getSettings();
    this.opacityProps.opacity = settings.hud.opacity / 100;
    for (const [nodeId, asset] of this.assets) {
      if (this.cards.has(nodeId)) continue; // cards: opacity also depends on the gaze (per frame)
      asset.document.rootElement.setProperties(this.opacityProps);
    }
    this.assets
      .get(TELEMETRY_NODE_ID)
      ?.document.rootElement.setProperties({ display: settings.hud.telemetry ? 'flex' : 'none' });
  }
}
