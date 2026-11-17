/**
 * Phase 3: Tag scanner (passthrough camera).
 *
 * The scan button next to the gear opens the Tag scanner window; while it
 * is open the headset's passthrough camera runs. This is how the app will
 * find the real anchors in the room: each AprilTag carries only its id,
 * the id resolves to its device (src/markers/apriltag-handshake.ts), and the
 * device's anchor is created where the tag was scanned.
 *
 * Step 1 (this file today) only answers whether Quest Browser gives the page
 * a camera image during the immersive-ar session: it lists the video
 * devices, adds an IWSDK CameraSource (getUserMedia + VideoTexture) and
 * shows state, cameras, resolution and the live image in the window. The X
 * closes the window and removes the CameraSource, which stops the stream.
 *
 * Not the door camera: "View camera" in the lock window is a feature of the
 * smart lock (camera-placeholder.uikitml) and stays separate.
 *
 * Every attempt is logged to the console ("[tag-scanner]") and kept in
 * localStorage (aura_camera_probe_log, last 20) so it survives a reload.
 */
import { CameraSource, CameraUtils, createSystem, Quaternion, Vector3, type Entity, type UIKitMLAsset } from '@iwsdk/core';
import { t } from '../i18n/i18n.js';
import { AprilTagDetector } from '../markers/apriltag-detector.js';
import { APRILTAG_FAMILY, resolveTag } from '../markers/apriltag-handshake.js';
import { deviceDisplayName } from '../devices/device-names.js';
import { emitTagScanned } from '../markers/scan-bus.js';
import { setPlacement, tagWorldPosition } from '../markers/tag-placement.js';
import { onActivate } from '../ui/activation.js';
import { playConfirm } from '../ui/feedback-sound.js';

const SCANNER_NODE_ID = 'tag-scanner';
const BUTTON_NODE_ID = 'scan-button';
const LOG_KEY = 'aura_camera_probe_log';
const AMBER = '#ffb850';
const CYAN = '#62e2ef';
const DANGER = '#ff8a80';
/** Frames are scanned at this rate, downscaled to SCAN_WIDTH (keeps the frame budget). */
const SCAN_INTERVAL_MS = 200;
const SCAN_WIDTH = 960;

type ScanState = 'idle' | 'starting' | 'active' | 'error' | 'unsupported';

export class AuraTagScannerSystem extends createSystem({
  cameras: { required: [CameraSource] },
}) {
  private panel: UIKitMLAsset | null = null;
  private button: UIKitMLAsset | null = null;
  private source: Entity | null = null;
  private open = false;
  private lastState: ScanState = 'idle';
  private deviceSummary = '';
  private startedAt = 0;
  private readonly detector = new AprilTagDetector();
  private scanCanvas: HTMLCanvasElement | null = null;
  private scanCtx: CanvasRenderingContext2D | null = null;
  private lastScanAt = 0;
  private lastReport = '';
  private readonly seenIds = new Set<number>();
  private readonly headPos = new Vector3();
  private readonly headQuat = new Quaternion();
  private readonly tagPos = new Vector3();

  update(): void {
    if (!this.panel || !this.button) this.tryBind();
    const source = this.source;
    if (!source || !source.hasComponent(CameraSource)) return;
    const state = source.getValue(CameraSource, 'state') as string;
    if (state === 'active' && this.lastState !== 'active') {
      const video = source.getValue(CameraSource, 'videoElement') as HTMLVideoElement | null;
      const texture = source.getValue(CameraSource, 'texture');
      const size = video ? `${video.videoWidth}x${video.videoHeight}` : '?';
      this.record('active', `${size}, ${Math.round(performance.now() - this.startedAt)} ms`);
      this.render('active', size);
      this.feed()?.setProperties({ src: texture as never, display: 'flex' });
    } else if (state === 'error' && this.lastState !== 'error') {
      this.record('error', 'CameraSource state=error (see console)');
      this.render('error', 'getUserMedia failed');
    } else if (state === 'active') {
      const now = performance.now();
      if (now - this.lastScanAt >= SCAN_INTERVAL_MS) {
        this.lastScanAt = now;
        this.scan(source.getValue(CameraSource, 'videoElement') as HTMLVideoElement | null);
      }
    }
  }

  /**
   * Reads one downscaled frame, reports its mean brightness (proves the
   * pixels are real, not black) and the printed tags found in it. A tag
   * whose number is in the registry shows its device; others show
   * "not registered".
   */
  private scan(video: HTMLVideoElement | null): void {
    if (!video || video.videoWidth === 0) return;
    const w = SCAN_WIDTH;
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    if (!this.scanCanvas) {
      this.scanCanvas = document.createElement('canvas');
      this.scanCtx = this.scanCanvas.getContext('2d', { willReadFrequently: true });
    }
    const canvas = this.scanCanvas;
    const ctx = this.scanCtx;
    if (!ctx) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.drawImage(video, 0, 0, w, h);
    const image = ctx.getImageData(0, 0, w, h);
    let sum = 0;
    for (let i = 0; i < image.data.length; i += 64) sum += image.data[i]! + image.data[i + 1]! + image.data[i + 2]!;
    const brightness = Math.round(sum / ((image.data.length / 64) * 3));
    const tags = this.detector.detect(w, h, image.data);
    const head = this.world.playerHeadEntity.object3D;
    if (head) {
      head.getWorldPosition(this.headPos);
      head.getWorldQuaternion(this.headQuat);
    }
    const found = tags.map((tag) => {
      const device = resolveTag({ family: APRILTAG_FAMILY, id: tag.id });
      if (device && head) {
        // Where the physical tag is (refined on every read); the virtual tag
        // and the window are attached to it by AuraHudFollowSystem.
        tagWorldPosition(tag.corners, w, h, this.headPos, this.headQuat, this.tagPos);
        setPlacement(device, this.tagPos);
      }
      if (!this.seenIds.has(tag.id)) {
        this.seenIds.add(tag.id);
        this.record('active', `tag ${tag.id} -> ${device ?? 'not registered'} (bit errors ${tag.bitErrors})`);
        // A registered tag loads its device (once per scanner session).
        if (device) emitTagScanned(device);
      }
      return device
        ? `${t('scanner.tagDevice', tag.id)} - ${deviceDisplayName(device)}`
        : t('scanner.tagUnknown', String(tag.id));
    });
    const report = `${found.join(' · ') || t('scanner.noTag')} | ${t('scanner.squares')} ${this.detector.lastCandidates} | ${t('scanner.brightness')} ${brightness}`;
    if (report === this.lastReport) return;
    this.lastReport = report;
    this.panel?.getElementById('txt-scanner-state')?.setProperties({
      text: found.length ? found.join(' · ') : t('cameraTest.active'),
      color: AMBER,
    });
    this.panel?.getElementById('txt-scanner-sub')?.setProperties({ text: report });
  }

  private tryBind(): void {
    if (!this.panel) {
      const panel = this.world.getSceneObject<UIKitMLAsset>(SCANNER_NODE_ID);
      if (panel) {
        this.panel = panel;
        const close = panel.getElementById('scanner-close');
        if (close) this.cleanupFuncs.push(onActivate(close as never, panel as never, () => this.setOpen(false)));
        this.setOpen(false);
      }
    }
    if (!this.button) {
      const button = this.world.getSceneObject<UIKitMLAsset>(BUTTON_NODE_ID);
      const el = button?.getElementById('scan-button');
      if (button && el) {
        this.button = button;
        this.cleanupFuncs.push(onActivate(el as never, button as never, () => this.setOpen(!this.open)));
      }
    }
  }

  private setOpen(open: boolean): void {
    if (this.panel && open !== this.open) playConfirm();
    this.open = open;
    this.panel?.document.rootElement.setProperties({ display: open ? 'flex' : 'none' });
    this.button
      ?.getElementById('scan-button')
      ?.setProperties({ backgroundColor: open ? AMBER : '#2f4052' });
    if (open) void this.startCamera();
    else this.stopCamera();
  }

  private async startCamera(): Promise<void> {
    if (this.source) return;
    this.startedAt = performance.now();
    this.seenIds.clear();
    this.lastReport = '';
    if (!navigator.mediaDevices?.getUserMedia) {
      this.record('unsupported', 'navigator.mediaDevices.getUserMedia missing');
      this.render('unsupported');
      return;
    }
    this.render('starting');
    let deviceId = '';
    try {
      const devices = await CameraUtils.getDevices(true);
      this.deviceSummary = devices
        .map((d) => `${d.label || d.deviceId.slice(0, 6)} (${d.facing})`)
        .join(', ');
      console.info('[tag-scanner] devices:', devices);
      // Quest Browser lists the avatar ("virtual") camera separately from the
      // passthrough ("headset") cameras, each behind its own permission. The
      // avatar camera never sees the room, so pick a non-virtual camera,
      // preferring a back-facing one.
      const real = devices.filter((d) => !/virtual|avatar/i.test(d.label));
      const pick = real.find((d) => d.facing === 'back') ?? real[0];
      if (!pick) {
        this.record('error', `no headset camera; devices: ${this.deviceSummary || 'none'}`);
        this.render('error', t('cameraTest.needHeadsetCameras'));
        return;
      }
      deviceId = pick.deviceId;
      console.info('[tag-scanner] using camera:', pick.label || pick.deviceId);
    } catch (error) {
      this.record('error', `enumerate failed: ${String(error)}`);
      this.render('error', String(error));
      return;
    }
    if (!this.open || this.source) return; // closed while waiting
    const entity = this.world.createEntity();
    entity.addComponent(CameraSource, { deviceId, width: 1280, height: 960, frameRate: 30 });
    this.source = entity;
  }

  private stopCamera(): void {
    if (this.source) {
      this.source.dispose();
      this.source = null;
    }
    this.render('idle');
  }

  private feed() {
    return this.panel?.getElementById('scanner-feed') ?? null;
  }

  private render(state: ScanState, detail = ''): void {
    this.lastState = state;
    const panel = this.panel;
    if (!panel) return;
    const live = state === 'active';
    const color = live ? AMBER : state === 'error' || state === 'unsupported' ? DANGER : CYAN;
    panel
      .getElementById('txt-scanner-state')
      ?.setProperties({ text: t(`cameraTest.${state}`), color });
    const devices = this.deviceSummary ? `${t('cameraTest.devices')}: ${this.deviceSummary}` : '';
    const lines = [detail, devices].filter(Boolean).join(' | ');
    panel.getElementById('txt-scanner-sub')?.setProperties({ text: lines || t('cameraTest.hint') });
    if (!live) this.feed()?.setProperties({ display: 'none' });
  }

  private record(result: ScanState, detail: string): void {
    const entry = {
      at: new Date().toISOString(),
      result,
      detail,
      inXR: this.world.session != null,
      devices: this.deviceSummary,
    };
    console.info('[tag-scanner]', JSON.stringify(entry));
    try {
      const log = JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]') as unknown[];
      log.push(entry);
      localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-20)));
    } catch {
      // storage unavailable: the console line is enough
    }
  }
}
