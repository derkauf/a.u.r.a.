/**
 * A.U.R.A. v1 — Regras locais determinísticas.
 *
 * A base de decisão do v1: nenhuma IA, nenhuma rede. Toda decisão de
 * controle passa por aqui antes de tocar o estado do dispositivo.
 */

/** Prende o valor no intervalo [min, max] e arredonda para o passo. */
export function clampToStep(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  const stepped = Math.round((clamped - min) / step) * step + min;
  return Math.min(max, Math.max(min, stepped));
}

/** Inverte um booleano (liga/desliga, tranca/destranca). */
export function toggle(value: boolean): boolean {
  return !value;
}
