/**
 * A.U.R.A. v1 — Localization system.
 *
 * - Gives every UIKitML panel the full-Latin Inter font (see aura-font.ts).
 * - Applies the current locale to the static copy of the tag icons, device
 *   windows and door camera (titles, window-bar titles, button labels).
 *   Device names follow the name chosen in Settings › Devices (Rename).
 *
 * Dynamic copy (device status, toggle labels, anchor line) is owned by
 * AuraPanelSystem, and the Settings window by AuraSettingsPanelSystem;
 * both re-render on the same locale and settings signals.
 *
 * UIKitML files carry English text as the authored default so the editor
 * preview reads in English; this system overwrites it at runtime.
 */
import { createSystem, UIKitMLAsset } from '@iwsdk/core';
import { subscribeLocale, t, type MessageKey } from '../i18n/i18n.js';
import { deviceDisplayName } from '../devices/device-names.js';
import type { DeviceId } from '../markers/apriltag-handshake.js';
import { subscribeSettings } from '../settings/settings-store.js';
import { AURA_FONT_FAMILIES } from './aura-font.js';

/** An element's text: a message key, or a device's display name. */
type TextSource = { key: MessageKey } | { device: DeviceId };
type TextBinding = readonly [elementId: string, source: TextSource];

const STATIC_TEXT: Record<string, readonly TextBinding[]> = {
  'panel-lamp': [
    ['txt-title', { device: 'lamp-sala-01' }],
    ['txt-bar-title', { device: 'lamp-sala-01' }],
  ],
  'panel-ac': [
    ['txt-title', { device: 'ac-sala-01' }],
    ['txt-bar-title', { device: 'ac-sala-01' }],
  ],
  'panel-lock': [
    ['txt-title', { device: 'lock-porta-01' }],
    ['txt-bar-title', { device: 'lock-porta-01' }],
    ['control-cam-label', { key: 'action.viewCamera' }],
  ],
  'sticker-lamp': [['sticker-scan-label', { device: 'lamp-sala-01' }]],
  'sticker-ac': [['sticker-scan-label', { device: 'ac-sala-01' }]],
  'sticker-lock': [['sticker-scan-label', { device: 'lock-porta-01' }]],
  'camera-placeholder': [
    ['txt-camera-eyebrow', { key: 'camera.eyebrow' }],
    ['txt-camera-text', { key: 'camera.text' }],
    ['txt-camera-sub', { key: 'camera.sub' }],
  ],
  // Font only; their text is owned by other systems.
  settings: [],
  telemetry: [],
};

const NODE_IDS = Object.keys(STATIC_TEXT);

function resolve(source: TextSource): string {
  return 'key' in source ? t(source.key) : deviceDisplayName(source.device);
}

export class AuraLocalizationSystem extends createSystem() {
  private bound = new Map<string, UIKitMLAsset>();

  init(): void {
    this.cleanupFuncs.push(subscribeLocale(() => this.applyAll()));
    this.cleanupFuncs.push(subscribeSettings(() => this.applyAll()));
  }

  update(): void {
    // Bind panels as the scene loads; once all are bound this is a no-op.
    if (this.bound.size < NODE_IDS.length) this.tryBind();
  }

  private tryBind(): void {
    for (const nodeId of NODE_IDS) {
      if (this.bound.has(nodeId)) continue;
      const asset = this.world.getSceneObject<UIKitMLAsset>(nodeId);
      if (!asset) continue;
      this.bound.set(nodeId, asset);
      asset.document.rootElement.setProperties({ fontFamilies: AURA_FONT_FAMILIES });
      this.applyTo(nodeId, asset);
    }
  }

  private applyAll(): void {
    for (const [nodeId, asset] of this.bound) this.applyTo(nodeId, asset);
  }

  private applyTo(nodeId: string, asset: UIKitMLAsset): void {
    for (const [elementId, source] of STATIC_TEXT[nodeId] ?? []) {
      asset.getElementById(elementId)?.setProperties({ text: resolve(source) });
    }
  }
}
