/**
 * A.U.R.A. v1 — Entrada do app.
 *
 * O `virtual:iwsdk-project` é o módulo virtual do plugin: ele monta as
 * opções do World a partir do iwsdk.config.json + manifestos (assets e
 * componentes). Os sistemas são registrados explicitamente depois.
 */
import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { AuraAnchorSystem } from './anchors/anchor-service.js';
import { AuraCursorSystem } from './input/hand-ray-cursor.js';
import { AuraPanelSystem } from './ui/device-panel-system.js';
import { AuraLocalizationSystem } from './ui/localization-system.js';
import { AuraHoverScaleSystem } from './ui/hover-scale-system.js';
import { AuraHudFollowSystem } from './ui/hud-follow-system.js';
import { AuraSettingsPanelSystem } from './ui/settings-panel-system.js';
import { AuraAppearanceSystem } from './ui/appearance-system.js';

World.create(
  document.getElementById('scene-container') as HTMLDivElement,
  projectOptions,
).then((world) => {
  world.registerSystem(AuraAnchorSystem);
  world.registerSystem(AuraPanelSystem);
  world.registerSystem(AuraLocalizationSystem);
  world.registerSystem(AuraHoverScaleSystem);
  world.registerSystem(AuraHudFollowSystem);
  world.registerSystem(AuraSettingsPanelSystem);
  world.registerSystem(AuraAppearanceSystem);
  world.registerSystem(AuraCursorSystem);
});
