/**
 * Starts and pauses the sound design (sound-design.ts) with the XR session,
 * and plays the "there you go" lines when the camera reads a paper tag.
 */
import { createSystem, VisibilityState } from '@iwsdk/core';
import { subscribeTagScanned } from '../markers/scan-bus.js';
import { onPaperTagScanned, pauseSoundDesign, startSoundDesign } from './sound-design.js';

export class AuraSoundDesignSystem extends createSystem() {
  init(): void {
    this.cleanupFuncs.push(
      this.world.visibilityState.subscribe((state) => {
        if (state === VisibilityState.NonImmersive) pauseSoundDesign();
        else startSoundDesign();
      }),
    );
    this.cleanupFuncs.push(subscribeTagScanned(() => onPaperTagScanned()));
  }
}
