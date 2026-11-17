/**
 * A.U.R.A. v1 — Sistema dos painéis (Dispatch #2).
 *
 * Liga os 3 stickers AprilTag e os 3 painéis de dispositivo (UIKitML) ao
 * DeviceRegistry, guiado pelo schema de controles de cada dispositivo:
 *
 * - sticker → o botão mostra o nome do dispositivo. O primeiro pinch é a
 *   leitura SIMULADA do AprilTag (a câmera leria o tag; em v1 o pinch é o
 *   gatilho) → registra o dispositivo, marca como vinculado e abre o
 *   painel. Os pinches seguintes abrem e fecham o painel;
 * - painel → botões de toggle (liga/desliga, tranca/destranca) e de
 *   faixa (−/+ para temperatura e brilho), tudo pelo caminho único de
 *   update do registro; a câmera da fechadura abre o painel simulado.
 *
 * Painéis de dispositivos ainda não vinculados começam escondidos
 * (display: none) e só aparecem depois da leitura do tag — ou de
 * imediato, quando o vínculo veio de uma sessão anterior (restaurado).
 * Um painel fechado pelo usuário continua fechado até ele abrir de novo.
 * O texto dos elementos é atualizado via setProperties({ text }) no
 * elemento-pai: o Text filho do UIKitML lê a propriedade `text` do pai.
 */
import { createSystem, UIKitMLAsset } from '@iwsdk/core';
import { deviceRegistry, type DeviceEntry, type DeviceId } from '../devices/device-registry.js';
import { anchorStatus, anchorStatusText, subscribeAnchorStatus } from '../anchors/anchor-status.js';
import { subscribeLocale, t } from '../i18n/i18n.js';

const DEVICE_IDS: DeviceId[] = ['lamp-sala-01', 'ac-sala-01', 'lock-porta-01'];

/** Nós de cena (ver public/scenes/main.iwsdk.scene.json). */
const PANEL_NODE_IDS: Record<DeviceId, string> = {
  'lamp-sala-01': 'panel-lamp',
  'ac-sala-01': 'panel-ac',
  'lock-porta-01': 'panel-lock',
};
const STICKER_NODE_IDS: Record<DeviceId, string> = {
  'lamp-sala-01': 'sticker-lamp',
  'ac-sala-01': 'sticker-ac',
  'lock-porta-01': 'sticker-lock',
};
const CAMERA_NODE_ID = 'camera-placeholder';

/** Ids de elementos dentro dos arquivos public/ui/*.uikitml. */
const EL = {
  status: 'device-status',
  powerButton: 'control-power',
  powerLabel: 'control-power-label',
  rangeMinus: 'control-range-minus',
  rangePlus: 'control-range-plus',
  rangeValue: 'control-range-value',
  camButton: 'control-cam',
  anchorLine: 'anchor-status',
  stickerScanButton: 'sticker-scan-button',
  cameraClose: 'camera-close',
} as const;

export class AuraPanelSystem extends createSystem() {
  private panels = new Map<DeviceId, UIKitMLAsset>();
  private stickers = new Map<DeviceId, UIKitMLAsset>();
  private cameraPanel: UIKitMLAsset | null = null;
  /** Painéis vinculados que o usuário fechou pelo botão do sticker. */
  private closedByUser = new Set<DeviceId>();

  init(): void {
    this.cleanupFuncs.push(deviceRegistry.subscribe(() => this.refreshAll()));
    this.cleanupFuncs.push(subscribeAnchorStatus(() => this.refreshAnchorLines()));
    this.cleanupFuncs.push(subscribeLocale(() => this.refreshAll()));
  }

  update(): void {
    // Liga os assets quando a cena carrega; depois de tudo ligado, não faz nada.
    if (this.panels.size < DEVICE_IDS.length || this.stickers.size < DEVICE_IDS.length || !this.cameraPanel) {
      this.tryBind();
    }
  }

  private tryBind(): void {
    for (const deviceId of DEVICE_IDS) {
      if (!this.stickers.has(deviceId)) {
        const sticker = this.world.getSceneObject<UIKitMLAsset>(STICKER_NODE_IDS[deviceId]);
        if (sticker) {
          this.stickers.set(deviceId, sticker);
          this.wireSticker(deviceId, sticker);
        }
      }
      if (!this.panels.has(deviceId)) {
        const panel = this.world.getSceneObject<UIKitMLAsset>(PANEL_NODE_IDS[deviceId]);
        if (panel) {
          this.panels.set(deviceId, panel);
          this.wirePanel(deviceId, panel);
        }
      }
    }
    if (!this.cameraPanel) {
      const cam = this.world.getSceneObject<UIKitMLAsset>(CAMERA_NODE_ID);
      if (cam) {
        this.cameraPanel = cam;
        this.wireCamera(cam);
      }
    }
    this.refreshAll();
  }

  private wireSticker(deviceId: DeviceId, sticker: UIKitMLAsset): void {
    // Só o botão com o nome do dispositivo responde (um listener no sticker
    // inteiro também receberia o clique do botão e fecharia o que abriu).
    sticker.getElementById(EL.stickerScanButton)?.addEventListener('click', () => this.onStickerButton(deviceId));
  }

  /**
   * Primeiro pinch: leitura SIMULADA do AprilTag ("a câmera leu o tag") →
   * registra e abre o painel. Depois disso, o mesmo botão abre e fecha.
   */
  private onStickerButton(deviceId: DeviceId): void {
    if (!deviceRegistry.isBound(deviceId)) {
      this.closedByUser.delete(deviceId);
      deviceRegistry.scanAndRegister(deviceId);
      this.showPanel(deviceId);
      return;
    }
    if (this.closedByUser.has(deviceId)) {
      this.closedByUser.delete(deviceId);
      this.showPanel(deviceId);
    } else {
      this.closedByUser.add(deviceId);
      this.hidePanel(deviceId);
    }
  }

  private wirePanel(deviceId: DeviceId, panel: UIKitMLAsset): void {
    panel.getElementById(EL.powerButton)?.addEventListener('click', () => {
      const entry = deviceRegistry.get(deviceId);
      if (!entry) return;
      if (deviceId === 'lock-porta-01') {
        deviceRegistry.setLocked(deviceId, !entry.state.locked);
      } else {
        deviceRegistry.setPower(deviceId, !entry.state.power);
      }
    });
    panel.getElementById(EL.rangeMinus)?.addEventListener('click', () => this.bumpRange(deviceId, -1));
    panel.getElementById(EL.rangePlus)?.addEventListener('click', () => this.bumpRange(deviceId, 1));
    // Fechadura: abre a câmera SIMULADA (painel placeholder, sem feed real).
    panel.getElementById(EL.camButton)?.addEventListener('click', () => this.setCameraOpen(true));

    // Visibilidade inicial: mostra só se o tag já foi lido (restaurado).
    if (deviceRegistry.isBound(deviceId)) this.showPanel(deviceId);
    else this.hidePanel(deviceId);
  }

  private wireCamera(cam: UIKitMLAsset): void {
    cam.getElementById(EL.cameraClose)?.addEventListener('click', () => this.setCameraOpen(false));
    this.setCameraOpen(false);
  }

  private bumpRange(deviceId: DeviceId, dir: 1 | -1): void {
    const entry = deviceRegistry.get(deviceId);
    if (!entry) return;
    if (deviceId === 'ac-sala-01') {
      const control = entry.controls['setpoint_c'];
      if (control?.kind !== 'range') return;
      deviceRegistry.setSetpoint(deviceId, (entry.state.setpoint_c ?? control.min) + dir * control.step);
    } else if (deviceId === 'lamp-sala-01') {
      const control = entry.controls['brightness'];
      if (control?.kind !== 'range') return;
      deviceRegistry.setBrightness(deviceId, (entry.state.brightness ?? control.min) + dir * control.step);
    }
  }

  private refreshAll(): void {
    for (const [deviceId, panel] of this.panels) {
      const entry = deviceRegistry.get(deviceId);
      if (!entry) continue;
      panel.getElementById(EL.status)?.setProperties({ text: this.statusText(entry) });
      panel.getElementById(EL.powerLabel)?.setProperties({ text: this.toggleLabel(entry) });
      const range = panel.getElementById(EL.rangeValue);
      if (range) range.setProperties({ text: this.rangeText(entry) });
      if (deviceRegistry.isBound(deviceId) && !this.closedByUser.has(deviceId)) this.showPanel(deviceId);
    }
    this.refreshAnchorLines();
  }

  private refreshAnchorLines(): void {
    const text = anchorStatusText(anchorStatus);
    for (const panel of this.panels.values()) {
      panel.getElementById(EL.anchorLine)?.setProperties({ text });
    }
  }

  private statusText(entry: DeviceEntry): string {
    switch (entry.deviceId) {
      case 'lamp-sala-01':
        return entry.state.power ? t('status.lamp.on', entry.state.brightness ?? 80) : t('status.lamp.off');
      case 'ac-sala-01':
        return entry.state.power ? t('status.ac.on', entry.state.setpoint_c ?? 22) : t('status.ac.off');
      case 'lock-porta-01':
        return entry.state.locked ? t('status.lock.locked') : t('status.lock.unlocked');
    }
  }

  private toggleLabel(entry: DeviceEntry): string {
    if (entry.deviceId === 'lock-porta-01') {
      return entry.state.locked ? t('action.unlock') : t('action.lock');
    }
    return entry.state.power ? t('action.turnOff') : t('action.turnOn');
  }

  private rangeText(entry: DeviceEntry): string {
    if (entry.deviceId === 'ac-sala-01') return `${entry.state.setpoint_c ?? 22}°C`;
    if (entry.deviceId === 'lamp-sala-01') return `${entry.state.brightness ?? 80}%`;
    return '';
  }

  private showPanel(deviceId: DeviceId): void {
    this.setPanelDisplay(deviceId, 'flex');
  }

  private hidePanel(deviceId: DeviceId): void {
    this.setPanelDisplay(deviceId, 'none');
  }

  /**
   * Mostra/esconde o painel inteiro: o display vai no elemento raiz do
   * documento UIKitML (a UIKitMLAsset é um Group; o root é o Panel).
   */
  private setPanelDisplay(deviceId: DeviceId, display: 'flex' | 'none'): void {
    this.panels.get(deviceId)?.document.rootElement.setProperties({ display });
  }

  private setCameraOpen(open: boolean): void {
    this.cameraPanel?.document.rootElement.setProperties({ display: open ? 'flex' : 'none' });
  }
}
