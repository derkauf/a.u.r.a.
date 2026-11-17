/**
 * A.U.R.A. v1 — Localization system.
 *
 * Gives every UIKitML panel the full-Latin Inter font (see aura-font.ts),
 * applies the current locale to the static copy of every panel
 * (titles, hints, button labels) and wires the Settings panel's language
 * buttons. Dynamic copy (device status, toggle labels, anchor line) is
 * owned by AuraPanelSystem, which re-renders on the same locale signal.
 *
 * UIKitML files carry English text as the authored default so the editor
 * preview reads in English; this system overwrites it at runtime.
 */
import { createSystem, UIKitMLAsset } from '@iwsdk/core';
import { getLocale, setLocale, subscribeLocale, t, type Locale, type MessageKey } from '../i18n/i18n.js';
import { AURA_FONT_FAMILIES } from './aura-font.js';

/** [element id, message key, optional {value}] per scene node. */
type TextBinding = readonly [elementId: string, key: MessageKey, value?: string | number];

const STATIC_TEXT: Record<string, readonly TextBinding[]> = {
  'panel-lamp': [
    ['txt-eyebrow', 'common.eyebrow'],
    ['txt-title', 'device.lamp.title'],
    ['txt-hint', 'common.hint'],
  ],
  'panel-ac': [
    ['txt-eyebrow', 'common.eyebrow'],
    ['txt-title', 'device.ac.title'],
    ['txt-hint', 'common.hint'],
  ],
  'panel-lock': [
    ['txt-eyebrow', 'common.eyebrow'],
    ['txt-title', 'device.lock.title'],
    ['txt-hint', 'common.hint'],
    ['control-cam-label', 'action.viewCamera'],
  ],
  'sticker-lamp': [
    ['txt-sticker-label', 'device.lamp.title'],
    ['txt-sticker-sub', 'sticker.sub', 0],
    ['sticker-scan-label', 'sticker.scan'],
  ],
  'sticker-ac': [
    ['txt-sticker-label', 'device.ac.title'],
    ['txt-sticker-sub', 'sticker.sub', 1],
    ['sticker-scan-label', 'sticker.scan'],
  ],
  'sticker-lock': [
    ['txt-sticker-label', 'device.lock.title'],
    ['txt-sticker-sub', 'sticker.sub', 2],
    ['sticker-scan-label', 'sticker.scan'],
  ],
  'camera-placeholder': [
    ['txt-camera-eyebrow', 'camera.eyebrow'],
    ['txt-camera-text', 'camera.text'],
    ['txt-camera-sub', 'camera.sub'],
    ['camera-close-label', 'camera.close'],
  ],
  settings: [
    ['txt-settings-title', 'settings.title'],
    ['txt-settings-language', 'settings.language'],
  ],
};

const SETTINGS_NODE_ID = 'settings';
const LANGUAGE_BUTTONS: Record<Locale, string> = { en: 'lang-en', 'pt-BR': 'lang-pt' };
const ACTIVE_BG = '#2a9d8f';
const INACTIVE_BG = '#2c3440';
const NODE_IDS = Object.keys(STATIC_TEXT);

export class AuraLocalizationSystem extends createSystem() {
  private bound = new Map<string, UIKitMLAsset>();

  init(): void {
    this.cleanupFuncs.push(subscribeLocale(() => this.applyAll()));
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
      if (nodeId === SETTINGS_NODE_ID) this.wireSettings(asset);
      this.applyTo(nodeId, asset);
    }
  }

  private wireSettings(settings: UIKitMLAsset): void {
    for (const locale of Object.keys(LANGUAGE_BUTTONS) as Locale[]) {
      const button = settings.getElementById(LANGUAGE_BUTTONS[locale]);
      if (!button) continue;
      const select = (): void => setLocale(locale);
      button.addEventListener('click', select);
      this.cleanupFuncs.push(() => button.removeEventListener('click', select));
    }
  }

  private applyAll(): void {
    for (const [nodeId, asset] of this.bound) this.applyTo(nodeId, asset);
  }

  private applyTo(nodeId: string, asset: UIKitMLAsset): void {
    for (const [elementId, key, value] of STATIC_TEXT[nodeId] ?? []) {
      asset.getElementById(elementId)?.setProperties({ text: t(key, value) });
    }
    if (nodeId === SETTINGS_NODE_ID) {
      const current = getLocale();
      for (const locale of Object.keys(LANGUAGE_BUTTONS) as Locale[]) {
        asset
          .getElementById(LANGUAGE_BUTTONS[locale])
          ?.setProperties({ backgroundColor: locale === current ? ACTIVE_BG : INACTIVE_BG });
      }
    }
  }
}
