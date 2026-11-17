/**
 * A.U.R.A. v1 — Serviço de âncoras persistentes (Dispatch #1).
 *
 * Responsabilidade única: ligar o componente XRAnchor (+ AuraDevice) à
 * entidade do painel de cada dispositivo JÁ VINCULADO (tag lido). O SDK
 * faz o resto: cria a âncora nativa, persiste o UUID e restaura na
 * sessão seguinte. Este sistema só observa e registra:
 *
 * - query `anchored`: painéis cujo XRAnchor está com `attached === true`
 *   (o sinal real de que a âncora nativa está ativa);
 * - log de diagnóstico em localStorage (aura_anchor_test_log) com os
 *   eventos da sessão — é o registro do teste de round-trip.
 *
 * Sem polling por frame: o vínculo é disparado pela notificação do
 * registro (tag lido) e o update() só retenta enquanto houver painel
 * vinculado ainda sem XRAnchor (cena carregando). Depois de tudo
 * vinculado, o update() não faz nada.
 */
import { clearPlacement } from '../markers/tag-placement.js';
import { createSystem, eq, XRAnchor } from '@iwsdk/core';
import { AuraDevice } from '../components/aura-components.js';
import { deviceRegistry, type DeviceId } from '../devices/device-registry.js';
import {
  appendAnchorTestLog,
  readStoredAnchorUuid,
  updateAnchorStatus,
} from './anchor-status.js';

/** Nó de cena de cada painel (ver public/scenes/main.iwsdk.scene.json). */
const PANEL_NODE_IDS: Record<DeviceId, string> = {
  'lamp-sala-01': 'panel-lamp',
  'ac-sala-01': 'panel-ac',
  'lock-porta-01': 'panel-lock',
  'tv-sala-01': 'panel-tv',
};

export class AuraAnchorSystem extends createSystem({
  anchored: { required: [XRAnchor], where: [eq(XRAnchor, 'attached', true)] },
}) {
  private bound = new Set<DeviceId>();

  init(): void {
    const uuid = readStoredAnchorUuid();
    const hasUuid = uuid !== null;
    updateAnchorStatus({
      uuidPresent: hasUuid,
      uuid,
      restored: null,
      lastEvent: hasUuid
        ? 'session-start: UUID persistido encontrado (caminho de restore)'
        : 'session-start: sem UUID (caminho de criação)',
    });
    appendAnchorTestLog(
      hasUuid
        ? 'session-start: stored anchor UUID found — restore path'
        : 'session-start: no stored anchor UUID — create path',
    );

    // Âncora nativa ativa (o sinal real, não só o componente presente).
    this.cleanupFuncs.push(
      this.queries.anchored.subscribe(
        'qualify',
        () => {
          updateAnchorStatus({
            attached: true,
            restored: readStoredAnchorUuid() !== null,
            lastEvent: 'anchor-attached',
          });
          appendAnchorTestLog('anchor-attached: XRAnchor ativo (grupo ancorado estável)');
        },
        true,
      ),
    );
    this.cleanupFuncs.push(
      this.queries.anchored.subscribe('disqualify', () => {
        updateAnchorStatus({ attached: false, lastEvent: 'anchor-detached' });
        appendAnchorTestLog('anchor-detached');
      }),
    );

    // Tag lido → vincular o painel (também cobre os restaurados da sessão anterior).
    this.cleanupFuncs.push(deviceRegistry.subscribe(() => this.tryBindAll()));
    this.tryBindAll();
  }

  update(): void {
    // Retenta só enquanto houver painel vinculado ainda sem XRAnchor.
    if (this.bound.size < deviceRegistry.boundDeviceIds.size) this.tryBindAll();
  }

  private tryBindAll(): void {
    // Vínculo removido nas Configurações (remover / recalibrar / limpar):
    // solta o painel da âncora; uma nova leitura do tag ancora de novo.
    for (const deviceId of [...this.bound]) {
      if (!deviceRegistry.isBound(deviceId)) this.releasePanel(deviceId);
    }
    for (const deviceId of deviceRegistry.boundDeviceIds) {
      if (!this.bound.has(deviceId)) this.tryBindPanel(deviceId);
    }
  }

  private releasePanel(deviceId: DeviceId): void {
    const entity = this.world.getSceneEntity(PANEL_NODE_IDS[deviceId]);
    if (entity?.hasComponent(XRAnchor)) entity.removeComponent(XRAnchor);
    clearPlacement(deviceId); // forget the spot in front of its printed tag
    this.bound.delete(deviceId);
    appendAnchorTestLog(`panel-released: ${deviceId} (vínculo removido nas Configurações)`);
  }

  private tryBindPanel(deviceId: DeviceId): void {
    const entity = this.world.getSceneEntity(PANEL_NODE_IDS[deviceId]);
    if (!entity) return; // Cena ainda carregando; o update() retenta.
    if (!entity.hasComponent(XRAnchor)) entity.addComponent(XRAnchor);
    if (!entity.hasComponent(AuraDevice)) entity.addComponent(AuraDevice, { deviceId });
    this.bound.add(deviceId);
    appendAnchorTestLog(
      `panel-bound: ${deviceId} → ${PANEL_NODE_IDS[deviceId]} (XRAnchor + AuraDevice)`,
    );
  }
}
