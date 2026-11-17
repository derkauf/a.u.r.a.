/**
 * A.U.R.A. v1 — Componentes ECS.
 *
 * Módulo livre de sistemas (regra do IWSDK): só declara componentes.
 * Listados em src/components.ts via defineComponents().
 */
import { createComponent, Types } from '@iwsdk/core';

/**
 * Marca a entidade do painel de um dispositivo e diz qual dispositivo é.
 * O estado (ligado, temperatura, brilho, tranca) NÃO vive aqui — vive no
 * DeviceRegistry (src/devices/device-registry.ts), fonte única de verdade.
 * O componente serve para localizar o painel nas queries.
 */
export const AuraDevice = createComponent('AuraDevice', {
  deviceId: { type: Types.String, default: '' },
});
