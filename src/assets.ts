/**
 * A.U.R.A. v1 — Asset catalog.
 *
 * Evaluated twice, in two JS realms (runtime and editor): deterministic
 * and side-effect free — no World, DOM or timers here.
 * The 10 UIKitML assets of v1: 3 AprilTag icons, 3 device windows, the
 * door-lock camera placeholder, the Settings window, its gear button and
 * the telemetry line.
 */
import { AssetType, defineAssets } from '@iwsdk/core';

const publicAssetUrl = (filePath: string): string =>
  `${import.meta.env.BASE_URL}${filePath.replace(/^\/+/u, '')}`;

const uikitml = (fileName: string, name: string) => ({
  url: publicAssetUrl(`ui/${fileName}`),
  type: AssetType.UIKitML,
  name,
});

export default defineAssets({
  'sticker-lamp': uikitml('sticker-lamp.uikitml', 'AprilTag — Living room lamp (id 1)'),
  'sticker-ac': uikitml('sticker-ac.uikitml', 'AprilTag — Living room AC (id 2)'),
  'sticker-lock': uikitml('sticker-lock.uikitml', 'AprilTag — Front door lock (id 3)'),
  'panel-lamp': uikitml('panel-lamp.uikitml', 'Panel — Living room lamp'),
  'panel-ac': uikitml('panel-ac.uikitml', 'Panel — Living room AC'),
  'panel-lock': uikitml('panel-lock.uikitml', 'Panel — Front door lock'),
  'panel-tv': uikitml('panel-tv.uikitml', 'Panel — Living room TV (tag 10)'),
  'sticker-tv': uikitml('sticker-tv.uikitml', 'AprilTag — Living room TV (tag36h11 id 10)'),
  'camera-placeholder': uikitml('camera-placeholder.uikitml', 'Door camera (simulated)'),
  settings: uikitml('settings.uikitml', 'Settings'),
  'settings-gear': uikitml('settings-gear.uikitml', 'Settings gear button'),
  telemetry: uikitml('telemetry.uikitml', 'Telemetry line'),
  'scan-button': uikitml('scan-button.uikitml', 'Scan button (Phase 3)'),
  'tag-scanner': uikitml('tag-scanner.uikitml', 'Tag scanner (passthrough camera)'),
});
