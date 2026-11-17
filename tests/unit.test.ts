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
import { AprilTagDetector, PRINTED_TAG_CODES } from '../src/markers/apriltag-detector.js';
import { FOCAL_RATIO, TAG_SIZE_M, WINDOW_GAP_M, tagWorldPosition, windowPoseInFront } from '../src/markers/tag-placement.js';
import { Quaternion, Vector3 } from 'three';
import { DeviceRegistry } from '../src/devices/device-registry.js';
import { pinchMode } from '../src/ui/activation.js';
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

  it('ids 1, 2, 3 e 10 (TV de teste, tag impresso 00a), um por dispositivo (o 0 não é usado)', () => {
    assert.deepEqual(APRILTAG_IDS, {
      'lamp-sala-01': 1,
      'ac-sala-01': 2,
      'lock-porta-01': 3,
      'tv-sala-01': 10,
    });
    assert.equal(resolveTag({ family: 'tag36h11', id: 10 }), 'tv-sala-01');
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

describe('DeviceRegistry — recalibrar, limpar, exportar e importar', () => {
  it('unbind remove só o vínculo; o estado continua e persiste', () => {
    const storage = memoryStorage();
    const registry = new DeviceRegistry(storage);
    registry.scanAndRegister('ac-sala-01');
    registry.setSetpoint('ac-sala-01', 25);
    registry.unbind('ac-sala-01');
    assert.equal(registry.isBound('ac-sala-01'), false);
    assert.equal(registry.get('ac-sala-01')?.state.setpoint_c, 25);
    assert.equal(new DeviceRegistry(storage).isBound('ac-sala-01'), false);
  });

  it('unbindAll remove todos os vínculos', () => {
    const registry = new DeviceRegistry(memoryStorage());
    registry.scanAndRegister('lamp-sala-01');
    registry.scanAndRegister('lock-porta-01');
    registry.unbindAll();
    assert.equal(registry.boundDeviceIds.size, 0);
  });

  it('exportar e importar leva vínculos e estado para outro registro', () => {
    const source = new DeviceRegistry(memoryStorage());
    source.scanAndRegister('lamp-sala-01');
    source.setBrightness('lamp-sala-01', 40);
    const snapshot = JSON.parse(JSON.stringify(source.exportSnapshot())) as object;
    const target = new DeviceRegistry(memoryStorage());
    target.importSnapshot(snapshot);
    assert.equal(target.isBound('lamp-sala-01'), true);
    assert.equal(target.get('lamp-sala-01')?.state.brightness, 40);
    target.importSnapshot({ bound: ['nao-existe'], state: { 'nao-existe': {} } });
    assert.equal(target.boundDeviceIds.size, 1);
  });
});

describe('Sensibilidade do pinch — quando o controle dispara', () => {
  it('0–33 leve, 34–66 média, 67–100 firme', () => {
    assert.equal(pinchMode(0), 'light');
    assert.equal(pinchMode(25), 'light');
    assert.equal(pinchMode(50), 'medium');
    assert.equal(pinchMode(75), 'firm');
    assert.equal(pinchMode(100), 'firm');
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

describe('AprilTag detector (printed tags)', () => {
  /** Draws a tag36h11 code as an RGBA image: white quiet zone, black border, 6x6 bits (1 = white). */
  function renderTag(code: number, cell = 12): { w: number; h: number; data: Uint8ClampedArray } {
    const cells = 10;
    const w = cells * cell + 40;
    const h = w;
    const data = new Uint8ClampedArray(w * h * 4).fill(255);
    const bits = code.toString(2).padStart(36, '0');
    for (let cy = 0; cy < 8; cy++) {
      for (let cx = 0; cx < 8; cx++) {
        const inner = cy > 0 && cy < 7 && cx > 0 && cx < 7;
        const white = inner && bits[(cy - 1) * 6 + (cx - 1)] === '1';
        if (white) continue;
        for (let y = 0; y < cell; y++) {
          for (let x = 0; x < cell; x++) {
            const px = 20 + (cx + 1) * cell + x;
            const py = 20 + (cy + 1) * cell + y;
            const i = (py * w + px) * 4;
            data[i] = data[i + 1] = data[i + 2] = 0;
          }
        }
      }
    }
    return { w, h, data };
  }

  it('reads printed tags 1, 2 and 12 by their printed number', () => {
    const detector = new AprilTagDetector();
    for (const id of [1, 2, 12]) {
      const img = renderTag(PRINTED_TAG_CODES[id - 1]!);
      const found = detector.detect(img.w, img.h, img.data);
      assert.equal(found.length, 1, `tag ${id} not found`);
      assert.equal(found[0]!.id, id);
      assert.equal(found[0]!.bitErrors, 0);
    }
  });

  it('ignores a tag36h11 code that was not printed', () => {
    const detector = new AprilTagDetector();
    const img = renderTag(0xd5d628584); // family code not in the printed set
    assert.equal(detector.detect(img.w, img.h, img.data).length, 0);
  });
});

describe('Tag placement (window in front of the printed tag)', () => {
  it('a centered tag of N pixels lands straight ahead at the matching distance', () => {
    const w = 960;
    const h = 720;
    const focal = FOCAL_RATIO * w;
    const side = (TAG_SIZE_M * focal) / 1.5; // pixels for a tag 1.5 m away
    const c = { x: w / 2, y: h / 2 };
    const corners = [
      { x: c.x - side / 2, y: c.y - side / 2 },
      { x: c.x + side / 2, y: c.y - side / 2 },
      { x: c.x + side / 2, y: c.y + side / 2 },
      { x: c.x - side / 2, y: c.y + side / 2 },
    ];
    const head = new Vector3(0, 1.6, 0);
    const p = tagWorldPosition(corners, w, h, head, new Quaternion(), new Vector3());
    assert.ok(Math.abs(p.x) < 1e-6 && Math.abs(p.y - 1.6) < 1e-6 && Math.abs(p.z + 1.5) < 1e-6, `got ${p.toArray()}`);
  });

  it('the window sits between the tag and the head, facing the head', () => {
    const tag = new Vector3(0, 1.2, -1.5);
    const head = new Vector3(0, 1.6, 0);
    const pos = new Vector3();
    const quat = new Quaternion();
    windowPoseInFront(tag, head, pos, quat);
    assert.ok(Math.abs(pos.z - (-1.5 + WINDOW_GAP_M)) < 1e-6);
    const facing = new Vector3(0, 0, 1).applyQuaternion(quat);
    assert.ok(facing.z > 0.999, 'panel +Z should point at the head');
  });
});
