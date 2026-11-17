/**
 * A.U.R.A. v1 — Sistema dos painéis (Dispatch #2).
 *
 * Liga os 3 stickers AprilTag e os 3 painéis de dispositivo (UIKitML) ao
 * DeviceRegistry, guiado pelo schema de controles de cada dispositivo:
 *
 * - ícone do tag (o tag com o nome do dispositivo embaixo) → o primeiro
 *   pinch é a leitura SIMULADA do AprilTag (a câmera leria o tag; em v1 o
 *   pinch é o gatilho) → registra o dispositivo, marca como vinculado e
 *   abre a janela. Os pinches seguintes abrem e fecham a janela;
 * - janela → o X da barra embaixo da janela também fecha;
 * - painel → botões de toggle (liga/desliga, tranca/destranca) e de
 *   faixa (−/+ para temperatura e brilho), tudo pelo caminho único de
 *   update do registro; a câmera da fechadura abre o painel simulado.
 *
 * Estado inicial minimalista: só os ícones dos tags. Todas as janelas
 * começam fechadas (display: none), inclusive as de dispositivos cujo
 * vínculo veio de uma sessão anterior; a janela abre pelo ícone.
 * Uma janela só abre ou fecha por ação do usuário.
 * O texto dos elementos é atualizado via setProperties({ text }) no
 * elemento-pai: o Text filho do UIKitML lê a propriedade `text` do pai.
 */
import { createSystem, UIKitMLAsset } from '@iwsdk/core';
import { deviceRegistry, type DeviceEntry, type DeviceId } from '../devices/device-registry.js';
import { anchorStatus, anchorStatusText, subscribeAnchorStatus } from '../anchors/anchor-status.js';
import { subscribeLocale } from '../i18n/i18n.js';
import { deviceStatusText, deviceToggleLabel } from '../devices/device-text.js';
import { playConfirm } from './feedback-sound.js';
import { onActivate } from './activation.js';

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
  windowClose: 'window-close',
  cameraClose: 'camera-close',
} as const;

export class AuraPanelSystem extends createSystem() {
  private panels = new Map<DeviceId, UIKitMLAsset>();
  private stickers = new Map<DeviceId, UIKitMLAsset>();
  private cameraPanel: UIKitMLAsset | null = null;
  /** Janelas de dispositivo abertas agora. */
  private openPanels = new Set<DeviceId>();

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

  /** Wire a control through onActivate (pinch sensitivity) with cleanup. */
  private activate(asset: UIKitMLAsset, elementId: string, handler: () => void): void {
    const element = asset.getElementById(elementId);
    if (!element) return;
    this.cleanupFuncs.push(onActivate(element, asset.document.rootElement, handler));
  }

  private wireSticker(deviceId: DeviceId, sticker: UIKitMLAsset): void {
    // O ícone inteiro (id sticker-scan-button, a raiz do documento) é o botão.
    this.activate(sticker, EL.stickerScanButton, () => this.onStickerButton(deviceId));
  }

  /**
   * Primeiro pinch: leitura SIMULADA do AprilTag ("a câmera leu o tag") →
   * registra e abre a janela. Depois disso, o mesmo ícone abre e fecha.
   */
  private onStickerButton(deviceId: DeviceId): void {
    playConfirm();
    if (!deviceRegistry.isBound(deviceId)) {
      deviceRegistry.scanAndRegister(deviceId);
      this.showPanel(deviceId);
      return;
    }
    if (this.openPanels.has(deviceId)) this.hidePanel(deviceId);
    else this.showPanel(deviceId);
  }

  private wirePanel(deviceId: DeviceId, panel: UIKitMLAsset): void {
    this.activate(panel, EL.powerButton, () => {
      playConfirm();
      const entry = deviceRegistry.get(deviceId);
      if (!entry) return;
      if (deviceId === 'lock-porta-01') {
        deviceRegistry.setLocked(deviceId, !entry.state.locked);
      } else {
        deviceRegistry.setPower(deviceId, !entry.state.power);
      }
    });
    this.activate(panel, EL.rangeMinus, () => this.bumpRange(deviceId, -1));
    this.activate(panel, EL.rangePlus, () => this.bumpRange(deviceId, 1));
    // Fechadura: abre a câmera SIMULADA (painel placeholder, sem feed real).
    this.activate(panel, EL.camButton, () => this.setCameraOpen(true));

    // O X na barra embaixo da janela fecha.
    this.activate(panel, EL.windowClose, () => this.hidePanel(deviceId));

    // Estado inicial: só os ícones; toda janela começa fechada.
    this.hidePanel(deviceId);
  }

  private wireCamera(cam: UIKitMLAsset): void {
    this.activate(cam, EL.cameraClose, () => this.setCameraOpen(false));
    this.setCameraOpen(false);
  }

  private bumpRange(deviceId: DeviceId, dir: 1 | -1): void {
    playConfirm();
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
      // A device unbound from Settings (remove / recalibrate) closes its window.
      if (!deviceRegistry.isBound(deviceId) && this.openPanels.has(deviceId)) this.hidePanel(deviceId);
      panel.getElementById(EL.status)?.setProperties({ text: deviceStatusText(entry) });
      panel.getElementById(EL.powerLabel)?.setProperties({ text: deviceToggleLabel(entry) });
      const range = panel.getElementById(EL.rangeValue);
      if (range) range.setProperties({ text: this.rangeText(entry) });
    }
    this.refreshAnchorLines();
  }

  private refreshAnchorLines(): void {
    const text = anchorStatusText(anchorStatus);
    for (const panel of this.panels.values()) {
      panel.getElementById(EL.anchorLine)?.setProperties({ text });
    }
  }


  private rangeText(entry: DeviceEntry): string {
    if (entry.deviceId === 'ac-sala-01') return `${entry.state.setpoint_c ?? 22}°C`;
    if (entry.deviceId === 'lamp-sala-01') return `${entry.state.brightness ?? 80}%`;
    return '';
  }

  private showPanel(deviceId: DeviceId): void {
    this.openPanels.add(deviceId);
    this.setPanelDisplay(deviceId, 'flex');
  }

  private hidePanel(deviceId: DeviceId): void {
    this.openPanels.delete(deviceId);
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
