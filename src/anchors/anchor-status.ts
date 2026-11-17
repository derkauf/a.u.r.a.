/**
 * A.U.R.A. v1 — Estado compartilhado da âncora persistente.
 *
 * Como funciona a persistência no IWSDK (verificado no SDK instalado):
 * o SceneUnderstandingSystem cria UMA âncora nativa na origem do espaço
 * de referência, pede um handle persistente e guarda o UUID no
 * localStorage sob a chave do SDK (`iwsdk_scene_anchor_uuid`). Na sessão
 * seguinte ele restaura esse UUID. Todas as entidades com o componente
 * XRAnchor ficam presas a esse grupo ancorado estável — por isso cada
 * painel com XRAnchor reaparece no mesmo XYZ.
 *
 * Este módulo é só o espelho legível desse estado (para a linha de status
 * dos painéis e para o log do teste de round-trip). Não toca no SDK.
 */

import { t } from '../i18n/i18n.js';

export const SDK_ANCHOR_UUID_KEY = 'iwsdk_scene_anchor_uuid';
export const ANCHOR_TEST_LOG_KEY = 'aura_anchor_test_log';

export interface AnchorStatus {
  uuidPresent: boolean;
  uuid: string | null;
  attached: boolean;
  /** null = ainda não se sabe (nenhuma sessão XR nesta execução). */
  restored: boolean | null;
  lastEvent: string;
  updatedAt: number;
}

export const anchorStatus: AnchorStatus = {
  uuidPresent: false,
  uuid: null,
  attached: false,
  restored: null,
  lastEvent: 'init',
  updatedAt: Date.now(),
};

const listeners = new Set<(status: AnchorStatus) => void>();

export function updateAnchorStatus(patch: Partial<AnchorStatus>): void {
  Object.assign(anchorStatus, patch, { updatedAt: Date.now() });
  listeners.forEach((fn) => fn(anchorStatus));
}

export function subscribeAnchorStatus(fn: (status: AnchorStatus) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** O UUID persistido pelo SDK, se existir (null = primeira sessão). */
export function readStoredAnchorUuid(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(SDK_ANCHOR_UUID_KEY);
  } catch {
    return null;
  }
}

/** Short text for the panels' anchor status line, in the current locale. */
export function anchorStatusText(status: AnchorStatus): string {
  if (!status.attached) {
    return status.uuidPresent ? t('anchor.waitingRestore') : t('anchor.waiting');
  }
  return status.restored ? t('anchor.activeRestored') : t('anchor.active');
}

export interface AnchorTestLogEntry {
  t: string;
  event: string;
}

/** Log de diagnóstico do teste de round-trip (máx. 100 entradas). */
export function appendAnchorTestLog(event: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(ANCHOR_TEST_LOG_KEY);
    const log: AnchorTestLogEntry[] = raw ? (JSON.parse(raw) as AnchorTestLogEntry[]) : [];
    log.push({ t: new Date().toISOString(), event });
    localStorage.setItem(ANCHOR_TEST_LOG_KEY, JSON.stringify(log.slice(-100)));
  } catch {
    // Log é diagnóstico; nunca quebra o app.
  }
}

export function readAnchorTestLog(): AnchorTestLogEntry[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(ANCHOR_TEST_LOG_KEY);
    return raw ? (JSON.parse(raw) as AnchorTestLogEntry[]) : [];
  } catch {
    return [];
  }
}
