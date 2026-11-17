/**
 * A.U.R.A. v1 — Manifesto de componentes ECS.
 *
 * Módulo livre de sistemas (regra do IWSDK): só declara componentes.
 * O editor importa este mesmo manifesto para montar o inspetor.
 */
import { defineComponents } from '@iwsdk/core';
import { AuraDevice } from './components/aura-components.js';

export default defineComponents([AuraDevice]);
