/**
 * A.U.R.A. v1 — Registro de dispositivos simulados.
 *
 * Fonte única de verdade do estado dos 3 dispositivos. O registro é
 * alimentado pelo descritor resolvido do AprilTag (ver
 * src/markers/apriltag-handshake.ts) e persiste estado + vínculos em
 * localStorage, para que a segunda sessão encontre tudo no mesmo lugar
 * sem re-ler nenhum tag.
 *
 * Regras de atualização (caminho único): todo update passa por update(),
 * que aplica as regras locais (clamp + passo do schema de controles),
 * persiste e notifica os ouvintes (painéis). Nada fora daqui escreve
 * estado de dispositivo.
 *
 * Chaves no localStorage (origem: este app, não o SDK):
 * - aura_device_state_v1: { deviceId: { power, setpoint_c, brightness, locked } }
 * - aura_bound_devices_v1: [deviceId...] (tags já lidos = painéis vinculados)
 */
import { clampToStep } from '../core/rules.js';
import {
  DEVICE_DESCRIPTORS,
  simulateTagDetection,
  type DeviceDescriptor,
  type DeviceId,
} from '../markers/apriltag-handshake.js';

export type { DeviceId } from '../markers/apriltag-handshake.js';

export const DEVICE_STATE_STORAGE_KEY = 'aura_device_state_v1';
export const BOUND_DEVICES_STORAGE_KEY = 'aura_bound_devices_v1';

export interface DeviceState {
  power?: boolean;
  setpoint_c?: number;
  brightness?: number;
  locked?: boolean;
  volume?: number;
}

export interface DeviceEntry {
  deviceId: DeviceId;
  label: string;
  type: string;
  controlTarget: string;
  controls: DeviceDescriptor['controls'];
  state: DeviceState;
}

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

type Listener = (entry: DeviceEntry) => void;

/** Estado inicial de um dispositivo recém-registrado (antes de qualquer uso). */
function defaultStateFor(descriptor: DeviceDescriptor): DeviceState {
  const state: DeviceState = {};
  if ('power' in descriptor.controls) state.power = false;
  if ('setpoint_c' in descriptor.controls) state.setpoint_c = 22;
  if ('brightness' in descriptor.controls) state.brightness = 80;
  if ('locked' in descriptor.controls) state.locked = true;
  if ('volume' in descriptor.controls) state.volume = 30;
  return state;
}

/** localStorage quando existe (navegador); memória quando não existe (testes). */
function createStorage(): StorageLike {
  if (typeof localStorage !== 'undefined') return localStorage;
  const mem = new Map<string, string>();
  return {
    getItem: (key) => mem.get(key) ?? null,
    setItem: (key, value) => {
      mem.set(key, value);
    },
    removeItem: (key) => {
      mem.delete(key);
    },
  };
}

export class DeviceRegistry {
  private devices = new Map<DeviceId, DeviceEntry>();
  private bound = new Set<DeviceId>();
  private listeners = new Set<Listener>();
  private storage: StorageLike;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? createStorage();
    this.restore();
  }

  /** Dispositivos com tag já lido (painel vinculado à âncora). Leitura direta, sem alocação. */
  get boundDeviceIds(): ReadonlySet<DeviceId> {
    return this.bound;
  }

  /** Registra o dispositivo a partir do descritor (idempotente — re-ler não duplica). */
  registerFromDescriptor(descriptor: DeviceDescriptor): DeviceEntry {
    const existing = this.devices.get(descriptor.device_id);
    if (existing) return existing;
    const entry: DeviceEntry = {
      deviceId: descriptor.device_id,
      label: descriptor.label,
      type: descriptor.type,
      controlTarget: descriptor.bind.control_target,
      controls: descriptor.controls,
      state: defaultStateFor(descriptor),
    };
    // Restaura o estado persistido de sessões anteriores, se houver.
    const saved = this.readSavedState(descriptor.device_id);
    if (saved) entry.state = { ...entry.state, ...saved };
    this.devices.set(descriptor.device_id, entry);
    return entry;
  }

  /**
   * Leitura simulada do AprilTag: resolve o tag → descritor → registra →
   * marca como vinculado. É o "scan" da v1 (o pinch no sticker).
   */
  scanAndRegister(deviceId: DeviceId): DeviceEntry {
    const descriptor = simulateTagDetection(deviceId);
    const entry = this.registerFromDescriptor(descriptor);
    this.bind(deviceId);
    return entry;
  }

  /** Marca o dispositivo como vinculado (tag lido; painel ancorado). Idempotente. */
  bind(deviceId: DeviceId): void {
    if (this.bound.has(deviceId)) return;
    this.bound.add(deviceId);
    this.persistBound();
    const entry = this.devices.get(deviceId);
    if (entry) this.notify(entry);
  }

  isBound(deviceId: DeviceId): boolean {
    return this.bound.has(deviceId);
  }

  /**
   * Remove o vínculo (o tag precisa ser lido de novo). O estado do
   * dispositivo é mantido. Notifica os ouvintes para os painéis fecharem.
   */
  unbind(deviceId: DeviceId): void {
    if (!this.bound.delete(deviceId)) return;
    this.persistBound();
    const entry = this.devices.get(deviceId);
    if (entry) this.notify(entry);
  }

  /** Remove todos os vínculos (recalibração da sala inteira). */
  unbindAll(): void {
    for (const deviceId of [...this.bound]) this.unbind(deviceId);
  }

  /** Retrato serializável dos vínculos e do estado (exportar a sala). */
  exportSnapshot(): { bound: DeviceId[]; state: Partial<Record<DeviceId, DeviceState>> } {
    const state: Partial<Record<DeviceId, DeviceState>> = {};
    for (const [id, entry] of this.devices) state[id] = { ...entry.state };
    return { bound: [...this.bound], state };
  }

  /** Aplica um retrato exportado: vínculos e estado (ids desconhecidos são ignorados). */
  importSnapshot(snapshot: { bound?: unknown; state?: unknown }): void {
    const state = (snapshot.state ?? {}) as Partial<Record<string, DeviceState>>;
    for (const [id, saved] of Object.entries(state)) {
      if (!(id in DEVICE_DESCRIPTORS) || !saved) continue;
      const entry = this.registerFromDescriptor(DEVICE_DESCRIPTORS[id as DeviceId]);
      this.update(entry.deviceId, saved);
    }
    const bound = Array.isArray(snapshot.bound) ? snapshot.bound : [];
    for (const id of bound) {
      if (typeof id === 'string' && id in DEVICE_DESCRIPTORS) {
        this.registerFromDescriptor(DEVICE_DESCRIPTORS[id as DeviceId]);
        this.bind(id as DeviceId);
      }
    }
  }

  get(deviceId: DeviceId): DeviceEntry | undefined {
    return this.devices.get(deviceId);
  }

  getAll(): DeviceEntry[] {
    return [...this.devices.values()];
  }

  /**
   * CAMINHO ÚNICO de atualização de estado. Aplica as regras locais
   * (clamp + passo do schema), persiste e notifica os ouvintes.
   */
  update(deviceId: DeviceId, patch: Partial<DeviceState>): DeviceState {
    const entry = this.devices.get(deviceId);
    if (!entry) throw new Error(`Dispositivo não registrado: ${deviceId}`);
    const next: DeviceState = { ...entry.state };
    if (patch.power !== undefined) next.power = patch.power;
    if (patch.locked !== undefined) next.locked = patch.locked;
    const setpoint = entry.controls['setpoint_c'];
    if (patch.setpoint_c !== undefined && setpoint?.kind === 'range') {
      next.setpoint_c = clampToStep(patch.setpoint_c, setpoint.min, setpoint.max, setpoint.step);
    }
    const brightness = entry.controls['brightness'];
    if (patch.brightness !== undefined && brightness?.kind === 'range') {
      next.brightness = clampToStep(patch.brightness, brightness.min, brightness.max, brightness.step);
    }
    const volume = entry.controls['volume'];
    if (patch.volume !== undefined && volume?.kind === 'range') {
      next.volume = clampToStep(patch.volume, volume.min, volume.max, volume.step);
    }
    entry.state = next;
    this.persist();
    this.notify(entry);
    return { ...next };
  }

  setPower(deviceId: DeviceId, power: boolean): DeviceState {
    return this.update(deviceId, { power });
  }

  setLocked(deviceId: DeviceId, locked: boolean): DeviceState {
    return this.update(deviceId, { locked });
  }

  setSetpoint(deviceId: DeviceId, value: number): DeviceState {
    return this.update(deviceId, { setpoint_c: value });
  }

  setBrightness(deviceId: DeviceId, value: number): DeviceState {
    return this.update(deviceId, { brightness: value });
  }

  setVolume(deviceId: DeviceId, value: number): DeviceState {
    return this.update(deviceId, { volume: value });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(entry: DeviceEntry): void {
    this.listeners.forEach((fn) => fn(entry));
  }

  private persist(): void {
    try {
      const state: Record<string, DeviceState> = {};
      for (const [id, entry] of this.devices) state[id] = entry.state;
      this.storage.setItem(DEVICE_STATE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persistência é conveniência; nunca quebra o app.
    }
  }

  private persistBound(): void {
    try {
      this.storage.setItem(BOUND_DEVICES_STORAGE_KEY, JSON.stringify([...this.bound]));
    } catch {
      // Idem.
    }
  }

  private readSavedState(deviceId: DeviceId): DeviceState | null {
    try {
      const raw = this.storage.getItem(DEVICE_STATE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, DeviceState>;
      return parsed[deviceId] ?? null;
    } catch {
      return null;
    }
  }

  private restore(): void {
    try {
      const raw = this.storage.getItem(BOUND_DEVICES_STORAGE_KEY);
      if (raw) {
        const ids = JSON.parse(raw) as DeviceId[];
        for (const id of ids) {
          if (id in DEVICE_DESCRIPTORS) {
            this.registerFromDescriptor(DEVICE_DESCRIPTORS[id]);
            this.bound.add(id);
          }
        }
      }
    } catch {
      // Sem vínculo anterior — começa do zero.
    }
  }
}

/**
 * Instância compartilhada pelos sistemas (âncora, painéis). O registro é
 * criado na importação e restaura sozinho o estado persistido.
 */
export const deviceRegistry = new DeviceRegistry();
