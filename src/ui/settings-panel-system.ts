/**
 * A.U.R.A. v1 — Settings window (behind the gear button).
 *
 * The window starts hidden; the gear opens and closes it, the X in its bar
 * closes it, and Quit closes it and ends the XR session. Six sections, one
 * visible at a time, picked from the menu on the left:
 *
 * - Devices & Anchors: name, AprilTag id and state of each device; Test
 *   (toggles the device and back), Rename (cycles suggestions), Recalibrate
 *   and Remove (unbind: the tag must be scanned again), Clear all anchors.
 * - Interaction: pinch sensitivity (Light / Medium / Firm, see
 *   ui/activation.ts), magnetic snap strength, activation range, head nod
 *   (reserved, always off).
 * - HUD & Visual: Follow my view, overlay opacity, card size, telemetry.
 * - Audio & Feedback: confirmation sound volume.
 * - Comfort & Access: language (from the locale files), interface height.
 * - Privacy & Data: local-first notice, export room (JSON), erase
 *   calibration data.
 *
 * Destructive actions ask for a second tap. Every visible string comes from
 * the i18n system; every setting persists on the device.
 */
import { createSystem, UIKitMLAsset } from '@iwsdk/core';
import { cycleLocale, getLocale, getLocaleName, subscribeLocale, t, type MessageKey } from '../i18n/i18n.js';
import { deviceRegistry, type DeviceId } from '../devices/device-registry.js';
import { cycleDeviceName, deviceDisplayName } from '../devices/device-names.js';
import { deviceStatusText } from '../devices/device-text.js';
import { APRILTAG_IDS } from '../markers/apriltag-handshake.js';
import { ANCHOR_TEST_LOG_KEY, SDK_ANCHOR_UUID_KEY } from '../anchors/anchor-status.js';
import {
  getSettings,
  subscribeSettings,
  updateSettings,
  type CardSize,
  type Posture,
} from '../settings/settings-store.js';
import { isViewFollowOn, setViewFollow, subscribeViewFollow } from './view-follow.js';
import { playConfirm } from './feedback-sound.js';
import { onActivate, pinchMode, type PinchMode } from './activation.js';
import { exportRoomConfig } from '../settings/room-config.js';

const SETTINGS_NODE_ID = 'settings';
const GEAR_NODE_ID = 'settings-gear';

const SECTIONS = ['devices', 'interaction', 'hud', 'audio', 'comfort', 'privacy'] as const;
type SectionId = (typeof SECTIONS)[number];
const SECTION_TITLES: Record<SectionId, MessageKey> = {
  devices: 'section.devices',
  interaction: 'section.interaction',
  hud: 'section.hud',
  audio: 'section.audio',
  comfort: 'section.comfort',
  privacy: 'section.privacy',
};

const DEVICES: readonly { id: DeviceId; slug: string }[] = [
  { id: 'lamp-sala-01', slug: 'lamp' },
  { id: 'ac-sala-01', slug: 'ac' },
  { id: 'lock-porta-01', slug: 'lock' },
];

const SIZES: readonly CardSize[] = ['S', 'M', 'L'];
const POSTURES: readonly Posture[] = ['standing', 'seated'];

/** Fixed labels: element id → message key. */
const LABELS: readonly (readonly [string, MessageKey])[] = [
  ['txt-settings-title', 'settings.title'],
  ['quit-label', 'settings.quit'],
  ['lbl-int-nod', 'int.headNod'],
  ['int-nod-note', 'int.headNodNote'],
  ['lbl-int-pinch', 'int.pinch'],
  ['lbl-int-snap', 'int.snap'],
  ['lbl-int-range', 'int.range'],
  ['lbl-hud-follow', 'hud.follow'],
  ['lbl-hud-opacity', 'hud.opacity'],
  ['lbl-hud-size', 'hud.size'],
  ['lbl-hud-telemetry', 'hud.telemetry'],
  ['hud-more', 'hud.moreSoon'],
  ['lbl-aud-confirm', 'audio.confirm'],
  ['aud-more', 'audio.moreSoon'],
  ['lbl-cmf-language', 'comfort.language'],
  ['lbl-cmf-height', 'comfort.height'],
  ['cmf-standing-label', 'comfort.standing'],
  ['cmf-seated-label', 'comfort.seated'],
  ['priv-local', 'priv.local'],
  ['priv-export-label', 'priv.export'],
];

const ACTIVE = { bg: '#e9eaee', fg: '#111316' };
const INACTIVE = { bg: '#3d4046', fg: '#ffffff' };
const NAV_IDLE = { bg: '#26282c', fg: '#ffffff' };
const CONFIRM_WINDOW_MS = 4000;
const TEST_REVERT_MS = 2000;
const PINCH_LABEL: Record<PinchMode, MessageKey> = {
  light: 'int.pinch.light',
  medium: 'int.pinch.medium',
  firm: 'int.pinch.firm',
};
const PINCH_NOTE: Record<PinchMode, MessageKey> = {
  light: 'int.pinch.lightNote',
  medium: 'int.pinch.mediumNote',
  firm: 'int.pinch.firmNote',
};

export class AuraSettingsPanelSystem extends createSystem() {
  private panel: UIKitMLAsset | null = null;
  private gear: UIKitMLAsset | null = null;
  private open = false;
  private section: SectionId = 'devices';
  /** Destructive action waiting for its second tap, and when it expires. */
  private pendingConfirm: { action: 'clear' | 'erase'; until: number } | null = null;
  private deviceFeedback = '';
  private privacyFeedback = '';

  init(): void {
    const rerender = (): void => this.render();
    this.cleanupFuncs.push(subscribeLocale(rerender));
    this.cleanupFuncs.push(subscribeSettings(rerender));
    this.cleanupFuncs.push(subscribeViewFollow(rerender));
    this.cleanupFuncs.push(deviceRegistry.subscribe(rerender));
  }

  update(): void {
    if (!this.panel || !this.gear) this.tryBind();
    if (this.pendingConfirm && performance.now() > this.pendingConfirm.until) {
      this.pendingConfirm = null;
      this.render();
    }
  }

  private tryBind(): void {
    if (!this.gear) {
      const gear = this.world.getSceneObject<UIKitMLAsset>(GEAR_NODE_ID);
      if (gear) {
        this.gear = gear;
        this.on(gear, 'gear-button', () => this.setOpen(!this.open));
      }
    }
    if (!this.panel) {
      const panel = this.world.getSceneObject<UIKitMLAsset>(SETTINGS_NODE_ID);
      if (panel) {
        this.panel = panel;
        this.wire(panel);
        this.setOpen(false);
        this.render();
      }
    }
  }

  /** Control listener (pinch sensitivity) with the confirmation sound and cleanup. */
  private on(asset: UIKitMLAsset, elementId: string, handler: () => void): void {
    const element = asset.getElementById(elementId);
    if (!element) return;
    const listener = (): void => {
      playConfirm();
      handler();
    };
    this.cleanupFuncs.push(onActivate(element, asset.document.rootElement, listener));
  }

  private wire(panel: UIKitMLAsset): void {
    this.on(panel, 'window-close', () => this.setOpen(false));
    this.on(panel, 'quit-button', () => {
      this.setOpen(false);
      this.world.exitXR();
    });
    for (const section of SECTIONS) {
      this.on(panel, `nav-${section}`, () => {
        this.section = section;
        this.render();
      });
    }

    // Devices & Anchors
    for (const { id, slug } of DEVICES) {
      this.on(panel, `dev-${slug}-test`, () => this.testDevice(id));
      this.on(panel, `dev-${slug}-rename`, () => cycleDeviceName(id));
      this.on(panel, `dev-${slug}-recal`, () => {
        deviceRegistry.unbind(id);
        this.deviceFeedback = t('dev.feedback.recalibrate', deviceDisplayName(id));
        this.render();
      });
      this.on(panel, `dev-${slug}-remove`, () => {
        deviceRegistry.unbind(id);
        this.deviceFeedback = t('dev.feedback.removed', deviceDisplayName(id));
        this.render();
      });
    }
    this.on(panel, 'dev-clear', () => {
      if (!this.confirm('clear')) return;
      this.clearCalibration();
      this.deviceFeedback = t('dev.feedback.cleared');
      this.render();
    });

    // Interaction
    this.on(panel, 'int-pinch-minus', () => this.stepInteraction('pinchSensitivity', -25, 0, 100));
    this.on(panel, 'int-pinch-plus', () => this.stepInteraction('pinchSensitivity', 25, 0, 100));
    this.on(panel, 'int-snap-minus', () => this.stepInteraction('snapStrength', -25, 0, 100));
    this.on(panel, 'int-snap-plus', () => this.stepInteraction('snapStrength', 25, 0, 100));
    this.on(panel, 'int-range-minus', () => this.stepInteraction('activationRange', -15, 15, 90));
    this.on(panel, 'int-range-plus', () => this.stepInteraction('activationRange', 15, 15, 90));
    // Head nod is reserved; tapping only shows its note.
    this.on(panel, 'int-nod', () => updateSettings('interaction', { headNod: false }));

    // HUD & Visual
    this.on(panel, 'hud-follow', () => setViewFollow(!isViewFollowOn()));
    this.on(panel, 'hud-op-minus', () => this.stepOpacity(-10));
    this.on(panel, 'hud-op-plus', () => this.stepOpacity(10));
    for (const size of SIZES) this.on(panel, `hud-size-${size}`, () => updateSettings('hud', { cardSize: size }));
    this.on(panel, 'hud-tele', () => updateSettings('hud', { telemetry: !getSettings().hud.telemetry }));

    // Audio & Feedback
    this.on(panel, 'aud-minus', () => this.stepVolume(-10));
    this.on(panel, 'aud-plus', () => this.stepVolume(10));

    // Comfort & Access
    this.on(panel, 'cmf-lang-prev', () => cycleLocale(-1));
    this.on(panel, 'cmf-lang-next', () => cycleLocale(1));
    for (const posture of POSTURES) {
      this.on(panel, `cmf-${posture}`, () => updateSettings('comfort', { posture }));
    }

    // Privacy & Data
    this.on(panel, 'priv-export', () => {
      exportRoomConfig();
      this.privacyFeedback = t('priv.exported');
      this.render();
    });
    this.on(panel, 'priv-erase', () => {
      if (!this.confirm('erase')) return;
      this.clearCalibration();
      this.privacyFeedback = t('priv.erased');
      this.render();
    });
  }

  private setOpen(open: boolean): void {
    this.open = open;
    if (!open) this.pendingConfirm = null;
    this.panel?.document.rootElement.setProperties({ display: open ? 'flex' : 'none' });
    if (open) this.render();
  }

  /** First tap arms the action; a second tap within the window confirms it. */
  private confirm(action: 'clear' | 'erase'): boolean {
    if (this.pendingConfirm?.action === action && performance.now() <= this.pendingConfirm.until) {
      this.pendingConfirm = null;
      return true;
    }
    this.pendingConfirm = { action, until: performance.now() + CONFIRM_WINDOW_MS };
    this.render();
    return false;
  }

  /** Unbind every device and drop the stored room anchor (a new one is made next session). */
  private clearCalibration(): void {
    deviceRegistry.unbindAll();
    try {
      localStorage.removeItem(SDK_ANCHOR_UUID_KEY);
      localStorage.removeItem(ANCHOR_TEST_LOG_KEY);
    } catch {
      // Storage unavailable: the bindings are cleared anyway.
    }
  }

  /** Toggle the device, then restore it: proves the binding end to end. */
  private testDevice(id: DeviceId): void {
    const entry = deviceRegistry.get(id);
    if (!entry || !deviceRegistry.isBound(id)) {
      this.deviceFeedback = t('dev.feedback.notBound', deviceDisplayName(id));
      this.render();
      return;
    }
    const isLock = id === 'lock-porta-01';
    const original = isLock ? entry.state.locked : entry.state.power;
    if (isLock) deviceRegistry.setLocked(id, !original);
    else deviceRegistry.setPower(id, !original);
    setTimeout(() => {
      if (isLock) deviceRegistry.setLocked(id, Boolean(original));
      else deviceRegistry.setPower(id, Boolean(original));
    }, TEST_REVERT_MS);
    this.deviceFeedback = t('dev.feedback.tested', deviceDisplayName(id));
    this.render();
  }

  private stepInteraction(
    field: 'pinchSensitivity' | 'snapStrength' | 'activationRange',
    delta: number,
    min: number,
    max: number,
  ): void {
    const value = Math.max(min, Math.min(max, getSettings().interaction[field] + delta));
    updateSettings('interaction', { [field]: value });
  }

  private stepOpacity(delta: number): void {
    const opacity = Math.max(40, Math.min(100, getSettings().hud.opacity + delta));
    updateSettings('hud', { opacity });
  }

  private stepVolume(delta: number): void {
    const confirmVolume = Math.max(0, Math.min(100, getSettings().audio.confirmVolume + delta));
    updateSettings('audio', { confirmVolume });
    playConfirm(); // preview at the new volume
  }

  private text(elementId: string, text: string): void {
    this.panel?.getElementById(elementId)?.setProperties({ text });
  }

  private paint(elementId: string, labelId: string, style: { bg: string; fg: string }): void {
    this.panel?.getElementById(elementId)?.setProperties({ backgroundColor: style.bg });
    this.panel?.getElementById(labelId)?.setProperties({ color: style.fg });
  }

  private toggle(elementId: string, on: boolean): void {
    this.paint(elementId, `${elementId}-label`, on ? ACTIVE : INACTIVE);
    this.text(`${elementId}-label`, t(on ? 'settings.on' : 'settings.off'));
  }

  private render(): void {
    const panel = this.panel;
    // Closed: nothing to redraw (setOpen(true) renders). Redrawing ~100
    // texts and colors on every device change cost frames right at the tap.
    if (!panel || !this.open) return;
    const settings = getSettings();

    for (const [elementId, key] of LABELS) this.text(elementId, t(key));

    // Menu and the visible section.
    for (const section of SECTIONS) {
      const active = section === this.section;
      this.text(`nav-${section}-label`, t(SECTION_TITLES[section]));
      this.paint(`nav-${section}`, `nav-${section}-label`, active ? ACTIVE : NAV_IDLE);
      panel.getElementById(`sec-${section}`)?.setProperties({ display: active ? 'flex' : 'none' });
    }

    // Devices & Anchors
    for (const { id, slug } of DEVICES) {
      const entry = deviceRegistry.get(id);
      const bound = deviceRegistry.isBound(id);
      const state = bound && entry ? deviceStatusText(entry) : t('dev.notBound');
      this.text(`dev-${slug}-name`, deviceDisplayName(id));
      this.text(`dev-${slug}-meta`, `${t('dev.tag', APRILTAG_IDS[id])} · ${state}`);
      this.text(`dev-${slug}-test-label`, t('dev.test'));
      this.text(`dev-${slug}-rename-label`, t('dev.rename'));
      this.text(`dev-${slug}-recal-label`, t('dev.recalibrate'));
      this.text(`dev-${slug}-remove-label`, t('dev.remove'));
    }
    const clearArmed = this.pendingConfirm?.action === 'clear';
    this.text('dev-clear-label', t(clearArmed ? 'dev.clearAllConfirm' : 'dev.clearAll'));
    this.text('dev-feedback', this.deviceFeedback || ' ');

    // Interaction
    const mode = pinchMode(settings.interaction.pinchSensitivity);
    this.text('int-pinch-value', t(PINCH_LABEL[mode]));
    this.text('int-pinch-note', t(PINCH_NOTE[mode]));
    this.text('int-snap-value', `${settings.interaction.snapStrength}%`);
    this.text('int-range-value', `${settings.interaction.activationRange}°`);
    this.toggle('int-nod', settings.interaction.headNod);

    // HUD & Visual
    this.toggle('hud-follow', isViewFollowOn());
    this.text('hud-op-value', `${settings.hud.opacity}%`);
    for (const size of SIZES) {
      this.paint(`hud-size-${size}`, `hud-size-${size}-label`, size === settings.hud.cardSize ? ACTIVE : INACTIVE);
    }
    this.toggle('hud-tele', settings.hud.telemetry);

    // Audio & Feedback
    this.text('aud-value', `${settings.audio.confirmVolume}%`);

    // Comfort & Access
    this.text('cmf-lang-value', getLocaleName(getLocale()));
    this.text('cmf-lang-prev-label', '<');
    this.text('cmf-lang-next-label', '>');
    for (const posture of POSTURES) {
      this.paint(`cmf-${posture}`, `cmf-${posture}-label`, posture === settings.comfort.posture ? ACTIVE : INACTIVE);
    }

    // Privacy & Data
    const eraseArmed = this.pendingConfirm?.action === 'erase';
    this.text('priv-erase-label', t(eraseArmed ? 'priv.eraseConfirm' : 'priv.erase'));
    this.text('priv-feedback', this.privacyFeedback || ' ');
  }
}
