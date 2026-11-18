/**
 * A.U.R.A. — Sound design: the onboarding voice guide and background music.
 *
 * Voice guide (public/audio/voice/, copies of docs/ux/sound-design/voice-fx/),
 * each chapter at most once per app load:
 * - intro, a few seconds after the app opens (the XR session starts, or the
 *   first tap in the flat browser): vo1 welcome → pause → vo2 MVP → vo2b
 *   select markers;
 * - scanner, the first time the Tag scanner opens: vo3a full experience →
 *   wait for the camera to run → vo3b scanner → vo3c digital markers;
 * - first paper tag read by the camera, or the first use of a device control
 *   (power, lock/unlock, + / -) in a window opened from a digital marker:
 *   vo4a there you go → pause → vo5 thank you / call to action.
 * A new chapter cuts the one still playing (the user has moved on).
 *
 * Music (public/audio/music/, copies of docs/ux/sound-design/sound-fx/ui/):
 * one of three tracks, looped, quiet, and lowered further while the voice
 * speaks. Track, music volume, voice volume and the voice guide on/off live
 * in Settings › Audio & Feedback (settings-store.ts, `audio`).
 *
 * Browsers refuse audio before a user gesture; entering XR is one, so
 * everything starts from there. Nothing plays outside the session.
 */
import { getSettings, subscribeSettings } from '../settings/settings-store.js';

const BASE = import.meta.env.BASE_URL;
const voiceUrl = (name: string): string => `${BASE}audio/voice/aura-onboarding-${name}.mp3`;

/** Tracks in the order of the Settings selector; the last option is "Off". */
export const MUSIC_TRACKS = [
  { key: 'audio.track.ambient', url: `${BASE}audio/music/ambient-hologram.mp3` },
  { key: 'audio.track.morning', url: `${BASE}audio/music/morning-brief.mp3` },
  { key: 'audio.track.launch', url: `${BASE}audio/music/launch-ready.mp3` },
] as const;
/** musicTrack value meaning "no music". */
export const MUSIC_OFF = MUSIC_TRACKS.length;

const INTRO_DELAY_MS = 2500;
const INTRO_PAUSE_MS = 1800;
const LINE_GAP_MS = 600;
const CAMERA_WAIT_MAX_MS = 6000;
const AFTER_CAMERA_MS = 1500;
const THANKS_PAUSE_MS = 1500;
/** Lets the confirmation sound and the visible change land before the voice. */
const CONTROL_LEAD_MS = 1200;
/** Music level while the voice speaks (fraction of the music volume). */
const DUCK = 0.35;
/** Music volume is scaled down: 100% in Settings is still background level. */
const MUSIC_MAX = 0.5;

type Step = { clip: string } | { wait: number } | { until: () => Promise<void> };

let started = false;
let sessionActive = false;
const played = { intro: false, scanner: false, thanks: false };
let chapter = 0; // bumps to cancel the running chapter
let voice: HTMLAudioElement | null = null;
let speaking = false;
let music: HTMLAudioElement | null = null;
let musicUrl = '';
let duckLevel = 1;
let duckTimer: ReturnType<typeof setInterval> | null = null;
let cameraActive = false;
let cameraWaiters: (() => void)[] = [];

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function voiceVolume(): number {
  return Math.max(0, Math.min(1, getSettings().audio.voiceVolume / 100));
}

// ---- Music ---------------------------------------------------------------

function applyMusicVolume(): void {
  if (!music) return;
  const level = (getSettings().audio.musicVolume / 100) * MUSIC_MAX * duckLevel;
  music.volume = Math.max(0, Math.min(1, level));
}

function syncMusic(): void {
  const { musicTrack, musicVolume } = getSettings().audio;
  const track = MUSIC_TRACKS[musicTrack];
  if (!sessionActive || !track || musicVolume <= 0) {
    music?.pause();
    return;
  }
  if (!music || musicUrl !== track.url) {
    music?.pause();
    music = new Audio(track.url);
    music.loop = true;
    music.preload = 'auto';
    musicUrl = track.url;
  }
  applyMusicVolume();
  if (music.paused) void music.play().catch(() => undefined);
}

/** Smoothly lowers the music while the voice speaks, and back. */
function duck(down: boolean): void {
  const target = down ? DUCK : 1;
  if (duckTimer) clearInterval(duckTimer);
  duckTimer = setInterval(() => {
    const step = 0.08;
    duckLevel = duckLevel < target ? Math.min(target, duckLevel + step) : Math.max(target, duckLevel - step);
    applyMusicVolume();
    if (duckLevel === target && duckTimer) {
      clearInterval(duckTimer);
      duckTimer = null;
    }
  }, 40);
}

// ---- Voice guide ---------------------------------------------------------

function stopVoice(): void {
  if (voice) {
    voice.onended = null;
    voice.onerror = null;
    voice.pause();
    voice = null;
  }
  if (speaking) {
    speaking = false;
    duck(false);
  }
}

function playClip(name: string, token: number): Promise<void> {
  return new Promise((resolve) => {
    if (token !== chapter || !sessionActive) return resolve();
    const audio = new Audio(voiceUrl(name));
    audio.volume = voiceVolume();
    voice = audio;
    const done = (): void => {
      if (voice === audio) voice = null;
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    speaking = true;
    duck(true);
    void audio.play().catch(done);
  });
}

async function runChapter(steps: Step[]): Promise<void> {
  if (!getSettings().audio.voiceGuide) return;
  stopVoice();
  const token = ++chapter;
  for (const step of steps) {
    if (token !== chapter || !sessionActive) return;
    if ('clip' in step) await playClip(step.clip, token);
    else if ('wait' in step) {
      if (speaking) {
        speaking = false;
        duck(false);
      }
      await sleep(step.wait);
    } else await step.until();
  }
  if (token === chapter && speaking) {
    speaking = false;
    duck(false);
  }
}

function waitForCamera(): Promise<void> {
  if (cameraActive) return Promise.resolve();
  return Promise.race([
    new Promise<void>((resolve) => cameraWaiters.push(resolve)),
    sleep(CAMERA_WAIT_MAX_MS),
  ]);
}

function playIntro(): void {
  played.intro = true;
  void runChapter([
    { wait: INTRO_DELAY_MS },
    { clip: 'vo1-welcome' },
    { wait: INTRO_PAUSE_MS },
    { clip: 'vo2-mvp' },
    { wait: LINE_GAP_MS },
    { clip: 'vo2b-select-markers' },
  ]);
}

// ---- Public hooks --------------------------------------------------------

/** The app is open and the user has interacted (XR session start or a tap). */
export function startSoundDesign(): void {
  sessionActive = true;
  syncMusic();
  if (!started) {
    started = true;
    playIntro();
  }
}

/** The XR session ended or the page was hidden: silence everything. */
export function pauseSoundDesign(): void {
  sessionActive = false;
  chapter++;
  stopVoice();
  music?.pause();
}

/** The Tag scanner window opened. */
export function onScannerOpened(): void {
  cameraActive = false;
  if (played.scanner || played.thanks) return;
  played.scanner = true;
  void runChapter([
    { clip: 'vo3a-full-experience' },
    { until: waitForCamera },
    { wait: AFTER_CAMERA_MS },
    { clip: 'vo3b-scanner' },
    { wait: LINE_GAP_MS },
    { clip: 'vo3c-digital-markers' },
  ]);
}

/** The scanner's camera delivers frames. */
export function onScannerCameraActive(): void {
  cameraActive = true;
  const waiters = cameraWaiters;
  cameraWaiters = [];
  waiters.forEach((resolve) => resolve());
}

function playThanks(leadMs: number): void {
  if (played.thanks) return;
  played.thanks = true;
  void runChapter([
    { wait: leadMs },
    { clip: 'vo4a-there-you-go' },
    { wait: THANKS_PAUSE_MS },
    { clip: 'vo5-thank-you-cta' },
  ]);
}

/** The camera read a registered paper tag. */
export function onPaperTagScanned(): void {
  playThanks(0);
}

/**
 * A device control was used in its window (power, lock/unlock, + / -), e.g.
 * after opening it from a digital marker in the HUD: users who never scan a
 * paper tag also hear the closing lines, so the guide always completes.
 */
export function onDeviceControlUsed(): void {
  playThanks(CONTROL_LEAD_MS);
}

/** Settings › Replay voice guide: the whole guide can play again. */
export function replayVoiceGuide(): void {
  played.intro = played.scanner = played.thanks = false;
  if (sessionActive) playIntro();
}

subscribeSettings((settings) => {
  if (voice) voice.volume = voiceVolume();
  if (!settings.audio.voiceGuide) {
    chapter++;
    stopVoice();
  }
  syncMusic();
});
