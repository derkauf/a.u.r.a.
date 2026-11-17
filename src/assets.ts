/**
 * A.U.R.A. v1 — Asset catalog.
 *
 * Evaluated twice, in two JS realms (runtime and editor): deterministic
 * and side-effect free — no World, DOM or timers here.
 * The 8 UIKitML panels of v1: 3 AprilTag stickers, 3 device panels,
 * the door-lock camera placeholder and the Settings panel.
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
  'sticker-lamp': uikitml('sticker-lamp.uikitml', 'AprilTag — Living room lamp (id 0)'),
  'sticker-ac': uikitml('sticker-ac.uikitml', 'AprilTag — Living room AC (id 1)'),
  'sticker-lock': uikitml('sticker-lock.uikitml', 'AprilTag — Front door lock (id 2)'),
  'panel-lamp': uikitml('panel-lamp.uikitml', 'Panel — Living room lamp'),
  'panel-ac': uikitml('panel-ac.uikitml', 'Panel — Living room AC'),
  'panel-lock': uikitml('panel-lock.uikitml', 'Panel — Front door lock'),
  'camera-placeholder': uikitml('camera-placeholder.uikitml', 'Door camera (simulated)'),
  settings: uikitml('settings.uikitml', 'Settings'),
});
