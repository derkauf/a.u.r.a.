/**
 * A.U.R.A. v1 — Marcadores AprilTag (SIMULADO)
 *
 * O marcador da v1 é um AprilTag: um fiducial visual criado pelo APRIL
 * Robotics Lab da Universidade de Michigan (Edwin Olson, ICRA 2011).
 * Um tag carrega APENAS um identificador (família + id) — nada de JSON
 * dentro do marcador. O app resolve o id para o descritor do dispositivo
 * nesta tabela local. É por isso que o tag é mais robusto que um QR para
 * este uso: o conteúdo (o que o dispositivo faz) vive no app, e o marcador
 * é só a "chave" impressa na parede.
 *
 * Família v1: tag36h11 (o padrão de fato — 6x6 bits de dados, 587 códigos,
 * usado por FRC, Boston Dynamics Spot e pela maioria das ferramentas).
 * Ids v1: 0 = lâmpada, 1 = ar-condicionado, 2 = fechadura.
 *
 * Os tags imprimíveis são gerados no RealityScan Desktop (gratuito, Epic
 * Games): abrir um projeto → aba Alignment → ferramenta Detect Markers →
 * gerar/exportar os PDFs prontos para imprimir. Alternativa verificada:
 * os PDFs oficiais do projeto AprilTag (família tag36h11, ids 0–20).
 * Ver docs/apriltag-markers.md.
 *
 * LEITURA SIMULADA: em v1 não há detecção real por câmera (a pergunta
 * sobre a permissão da Passthrough Camera API continua em aberto). O evento
 * de "leitura" é o pinch no sticker do dispositivo na parede — a simulação
 * representa "a câmera leu o AprilTag". O fluxo depois da leitura é o
 * mesmo do handshake original: marcador → âncora persistente → painel.
 *
 * Conceito do handshake (inalterado): ver
 * aura-qr-handshake-schema-2026-10-11.md — o marcador mudou de QR para
 * AprilTag; o descritor do dispositivo + bind continuam os mesmos.
 */

export const APRILTAG_FAMILY = 'tag36h11' as const;

export type DeviceId = 'lamp-sala-01' | 'ac-sala-01' | 'lock-porta-01';
export type DeviceType = 'light' | 'hvac' | 'lock';

/** Um tag AprilTag: família + id numérico. Só isso — o tag não carrega dados. */
export interface AprilTag {
  family: typeof APRILTAG_FAMILY;
  id: number;
}

export type QrControlToggle = { kind: 'toggle' };
export type QrControlRange = { kind: 'range'; min: number; max: number; step: number };
/**
 * Extensão v1 do schema: uma ação de UI (abre uma visão simulada),
 * sem estado no dispositivo. No caso da fechadura: abrir a câmera.
 */
export type QrControlAction = { kind: 'action' };
export type DeviceControl = QrControlToggle | QrControlRange | QrControlAction;

/** Descritor do dispositivo — resolvido localmente a partir do id do tag. */
export interface DeviceDescriptor {
  device_id: DeviceId;
  label: string;
  type: DeviceType;
  controls: Record<string, DeviceControl>;
  bind: {
    /** "on-device": o tag fica colado no aparelho (ou no ponto de interação). */
    interaction: 'on-device';
    /** v1: dispositivo simulado. v3: matter://<node-id> (plug real). */
    control_target: `sim://${DeviceId}`;
  };
}

/** Tabela tag → dispositivo (a "chave" que o app usa para resolver o tag lido). */
export const APRILTAG_IDS: Record<DeviceId, number> = {
  'lamp-sala-01': 0,
  'ac-sala-01': 1,
  'lock-porta-01': 2,
};

/** Os 3 descritores de dispositivo da v1 (o antigo "payload" do handshake). */
export const DEVICE_DESCRIPTORS: Record<DeviceId, DeviceDescriptor> = {
  'lamp-sala-01': {
    device_id: 'lamp-sala-01',
    label: 'Lâmpada da sala',
    type: 'light',
    controls: {
      power: { kind: 'toggle' },
      brightness: { kind: 'range', min: 0, max: 100, step: 5 },
    },
    bind: { interaction: 'on-device', control_target: 'sim://lamp-sala-01' },
  },
  'ac-sala-01': {
    device_id: 'ac-sala-01',
    label: 'Ar-condicionado da sala',
    type: 'hvac',
    controls: {
      power: { kind: 'toggle' },
      setpoint_c: { kind: 'range', min: 16, max: 30, step: 1 },
    },
    bind: { interaction: 'on-device', control_target: 'sim://ac-sala-01' },
  },
  'lock-porta-01': {
    device_id: 'lock-porta-01',
    label: 'Fechadura da porta',
    type: 'lock',
    controls: {
      locked: { kind: 'toggle' },
      cam: { kind: 'action' },
    },
    bind: { interaction: 'on-device', control_target: 'sim://lock-porta-01' },
  },
};

export class AprilTagError extends Error {}

/**
 * Resolve um tag lido (família + id) para o dispositivo — é o que um
 * detector real faria ao ver o tag. Retorna null quando o tag não é
 * nenhum dos 3 da v1 (família errada ou id desconhecido).
 */
export function resolveTag(tag: AprilTag): DeviceId | null {
  if (tag.family !== APRILTAG_FAMILY) return null;
  for (const [deviceId, id] of Object.entries(APRILTAG_IDS) as Array<[DeviceId, number]>) {
    if (id === tag.id) return deviceId;
  }
  return null;
}

/** O tag (família + id) de um dispositivo da v1. */
export function tagForDevice(deviceId: DeviceId): AprilTag {
  return { family: APRILTAG_FAMILY, id: APRILTAG_IDS[deviceId] };
}

/**
 * SIMULAÇÃO da leitura: representa "a câmera leu o AprilTag deste
 * dispositivo". Em v1 o gatilho é o pinch no sticker; o caminho real
 * (Passthrough Camera API ou provisionamento pelo celular) entra depois
 * que a pergunta da permissão for respondida.
 */
export function simulateTagDetection(deviceId: DeviceId): DeviceDescriptor {
  const tag = tagForDevice(deviceId);
  const resolved = resolveTag(tag);
  if (resolved !== deviceId) {
    throw new AprilTagError(`Tag ${tag.family}:${tag.id} não resolveu para ${deviceId}.`);
  }
  return DEVICE_DESCRIPTORS[deviceId];
}
