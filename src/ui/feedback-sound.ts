/**
 * A.U.R.A. v1 — Confirmation sound.
 *
 * Plays the UI selection sound (public/audio/ui-select.mp3, a copy of
 * docs/ux/sound-design/sound-fx/ui/us-single-seam.mp3) when a control is activated, at the
 * "Confirmation sound" volume from the settings store (0 = silent).
 * A small pool of preloaded <audio> elements lets quick taps overlap.
 */
import { getSettings } from '../settings/settings-store.js';

const SOUND_URL = `${import.meta.env.BASE_URL}audio/ui-select.mp3`;
const POOL_SIZE = 3;

let pool: HTMLAudioElement[] | null = null;
let next = 0;

function getPool(): HTMLAudioElement[] {
  if (!pool) {
    pool = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(SOUND_URL);
      audio.preload = 'auto';
      return audio;
    });
  }
  return pool;
}

export function playConfirm(): void {
  const volume = getSettings().audio.confirmVolume / 100;
  if (volume <= 0 || typeof Audio === 'undefined') return;
  const audio = getPool()[next];
  next = (next + 1) % POOL_SIZE;
  audio.volume = Math.min(1, volume);
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Autoplay can be refused before the first user gesture; ignore.
  });
}
