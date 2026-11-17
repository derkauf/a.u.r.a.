/**
 * Testes unitários dos módulos puros da v1 (sem XR, sem DOM).
 * Roda com: npm run test:unit   (node --test, Node 24+)
 *
 * Os módulos puros não tocam em WebXR nem em UIKitML: dá para testar
 * o handshake do AprilTag, o registro de dispositivos e as regras
 * locais sem abrir o emulador.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  APRILTAG_FAMILY,
  APRILTAG_IDS,
  DEVICE_DESCRIPTORS,
  resolveTag,
  simulateTagDetection,
  tagForDevice,
} from '../src/markers/apriltag-handshake.js';
import { clampToStep } from '../src/core/rules.js';
import { DeviceRegistry } from '../src/devices/device-registry.js';
import { createProvider, LocalRulesProvider } from '../src/ai/providers/provider-interface.js';

function memoryStorage(): {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
} {
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

describe('AprilTag — família, ids e resolução', () => {
  it('família v1 é tag36h11', () => {
    assert.equal(APRILTAG_FAMILY, 'tag36h11');
  });

  it('ids 1, 2 e 3, um por dispositivo (o 0 não é usado)', () => {
    assert.deepEqual(APRILTAG_IDS, {
      'lamp-sala-01': 1,
      'ac-sala-01': 2,
      'lock-porta-01': 3,
    });
  });

  it('resolveTag: tag conhecido → dispositivo; desconhecido → null', () => {
    assert.equal(resolveTag({ family: 'tag36h11', id: 2 }), 'ac-sala-01');
    assert.equal(resolveTag({ family: 'tag36h11', id: 0 }), null);
    assert.equal(resolveTag({ family: 'tag36h11', id: 99 }), null);
    assert.equal(resolveTag({ family: 'tag16h5', id: 1 }), null);
  });

  it('tagForDevice devolve família + id do dispositivo', () => {
    assert.deepEqual(tagForDevice('lock-porta-01'), { family: 'tag36h11', id: 3 });
  });

  it('simulateTagDetection resolve o descritor certo (3 dispositivos)', () => {
    const lamp = simulateTagDetection('lamp-sala-01');
    assert.equal(lamp.label, 'Lâmpada da sala');
    assert.equal(lamp.type, 'light');
    assert.equal(lamp.bind.control_target, 'sim://lamp-sala-01');
    assert.equal(lamp.bind.interaction, 'on-device');

    const ac = simulateTagDetection('ac-sala-01');
    assert.deepEqual(ac.controls['setpoint_c'], { kind: 'range', min: 16, max: 30, step: 1 });

    const lock = simulateTagDetection('lock-porta-01');
    assert.deepEqual(lock.controls['cam'], { kind: 'action' });
    assert.equal(DEVICE_DESCRIPTORS['lock-porta-01'].label, 'Fechadura da porta');
  });
});

describe('Regras locais — clamp + passo', () => {
  it('prende no intervalo e arredonda para o passo', () => {
    assert.equal(clampToStep(22.4, 16, 30, 1), 22);
    assert.equal(clampToStep(31, 16, 30, 1), 30);
    assert.equal(clampToStep(10, 16, 30, 1), 16);
    assert.equal(clampToStep(83, 0, 100, 5), 85);
    assert.equal(clampToStep(82, 0, 100, 5), 80);
    assert.equal(clampToStep(150, 0, 100, 5), 100);
  });
});

describe('DeviceRegistry — registro, vínculo e persistência', () => {
  it('scanAndRegister registra, vincula e dá estado inicial', () => {
    const registry = new DeviceRegistry(memoryStorage());
    const ac = registry.scanAndRegister('ac-sala-01');
    assert.equal(ac.label, 'Ar-condicionado da sala');
    assert.equal(ac.state.power, false);
    assert.equal(ac.state.setpoint_c, 22);
    assert.equal(registry.isBound('ac-sala-01'), true);

    const lock = registry.scanAndRegister('lock-porta-01');
    assert.equal(lock.state.locked, true);
  });

  it('update aplica clamp do schema e notifica ouvintes', () => {
    const registry = new DeviceRegistry(memoryStorage());
    registry.scanAndRegister('ac-sala-01');
    let notified = 0;
    registry.subscribe(() => {
      notified += 1;
    });
    const state = registry.setSetpoint('ac-sala-01', 40);
    assert.equal(state.setpoint_c, 30); // clamp no máximo
    assert.equal(notified, 1);

    registry.scanAndRegister('lamp-sala-01');
    const lamp = registry.setBrightness('lamp-sala-01', 83);
    assert.equal(lamp.brightness, 85); // passo 5
  });

  it('estado e vínculo sobrevivem a um novo registro (segunda sessão)', () => {
    const storage = memoryStorage();
    const first = new DeviceRegistry(storage);
    first.scanAndRegister('ac-sala-01');
    first.setPower('ac-sala-01', true);
    first.setSetpoint('ac-sala-01', 24);
    first.scanAndRegister('lock-porta-01');
    first.setLocked('lock-porta-01', false);

    const second = new DeviceRegistry(storage); // mesma storage = sessão 2
    assert.equal(second.isBound('ac-sala-01'), true);
    assert.equal(second.isBound('lock-porta-01'), true);
    assert.equal(second.isBound('lamp-sala-01'), false);
    assert.equal(second.get('ac-sala-01')?.state.power, true);
    assert.equal(second.get('ac-sala-01')?.state.setpoint_c, 24);
    assert.equal(second.get('lock-porta-01')?.state.locked, false);
  });

  it('re-ler o tag não duplica nem zera o estado', () => {
    const registry = new DeviceRegistry(memoryStorage());
    registry.scanAndRegister('lamp-sala-01');
    registry.setPower('lamp-sala-01', true);
    registry.setBrightness('lamp-sala-01', 60);
    registry.scanAndRegister('lamp-sala-01'); // segunda leitura
    assert.equal(registry.get('lamp-sala-01')?.state.power, true);
    assert.equal(registry.get('lamp-sala-01')?.state.brightness, 60);
  });
});

describe('Provedor de IA — v1 não chama IA', () => {
  it('local-rules responde de forma determinística', async () => {
    const provider = new LocalRulesProvider();
    const out = JSON.parse(await provider.decide('ligar o ar')) as { provider: string };
    assert.equal(out.provider, 'local-rules');
  });

  it('jev e laya são stubs que falham explicitamente', async () => {
    await assert.rejects(() => createProvider('jev').decide('x'), /não configurado/);
    await assert.rejects(() => createProvider('laya').decide('x'), /não configurado/);
  });
});
