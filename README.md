# A.U.R.A. — Ambient User Responsive Automation

Spatial home control for Meta Quest, hands first. Look at a printed tag next to a device, and its controls appear right there, in the room, in mixed reality. Point with your hand, pinch to select. No controllers needed.

- **Try it (Meta Quest Browser):** https://aura.sixvectors.app/
- **Project page:** https://aura-home.sixvectors.app/
- **Devpost:** https://devpost.com/software/a-u-r-a-ambient-user-responsive-automation
- Built for the Meta VR Start Developer Competition 2026 (Meta Connect 2026).

This repository holds exactly the build that is live at https://aura.sixvectors.app/ for the judges, frozen at the competition deadline (18 Nov 2026, 12:00 PT). Development continues in a separate repository.

## What it does

The loop: **AprilTag next to a device → the headset camera reads it → the device's window opens in front of the tag → hand-ray cursor with magnetic snap.**

| Device | AprilTag (`tag36h11`) | Controls |
|---|---|---|
| Living-room lamp (`lamp-sala-01`) | id **1** | on/off, brightness 0–100% (step 5) |
| Living-room air conditioner (`ac-sala-01`) | id **2** | on/off, temperature 16–30 °C (step 1) |
| Front-door lock (`lock-porta-01`) | id **3** | lock/unlock, door camera (simulated) |
| Living-room TV (`tv-sala-01`) | id **10** | on/off, volume 0–100 (step 5) |

- **Camera tag scanner.** The scan button next to the gear opens the Tag scanner window with the live headset camera. A registered tag binds its device and opens its window in front of the printed tag, 24 cm above it, always turned toward you as you walk. A virtual copy of the tag is drawn over the paper; pinch it to open or close the window.
- **Persistent spatial anchors.** Windows opened from the HUD tag icons come back in the same place after a reload or a new session, with their values.
- **Hand-ray cursor** with magnetic snap: it eases onto the nearest control and leaves a cyan-to-amber trail.
- **Device state convention:** the same state always has the same color and icon (lock: red closed padlock / green open padlock; AC: blue snowflake).
- **Quest-style HUD** that follows your view, a head-locked telemetry line, and Settings in 7 sections (devices, interaction, HUD, audio, comfort, privacy, project phases). The interface is available in 5 languages.

### What is simulated

This is an MVP. **The devices are simulated** (`sim://` targets): there is no real hardware, Matter or Home Assistant behind them. The point is the experience of controlling a home through the room itself. Real devices through Matter are planned for a later phase.

## How to try it

1. Open https://aura.sixvectors.app/ in the Meta Quest Browser and enter AR.
2. **Without printed tags:** pinch a tag icon in the HUD to bind that device and open its window. This shows the whole flow.
3. **With printed tags (camera reading):**
   - Print `docs/apriltag/markers_Apriltag36h11_12counts_2pp.pdf` and stick tags 1, 2, 3 and 10 next to your devices.
   - When the browser asks for the camera, turn on **Headset cameras**. "Virtual cameras" alone only shows your avatar, so the image stays black.
   - Missed the prompt? Settings › Privacy & safety › Browser › Headset cameras, or the lock icon next to the address.
   - Pinch the scan button next to the gear and look at a tag from about half a meter.

Known limits of this build:
- The position of a tag read by the camera lasts only for the session; after a reload, scan it again. The HUD icons' anchors do persist.
- The window's position comes from the camera image and the head pose, without room depth, so it is approximate.

## Run it locally

Requirements:
- **Node.js** 20.19+, 22.12+ or 24+, with npm.
- A **Chrome/Chromium** browser. The IWSDK CLI downloads one on first run.
- A **Meta Quest 3/3S** in developer mode, optional, for testing on the headset.

```bash
npm install
npm run dev          # https://localhost:8081/ with IWER, the in-browser XR emulator (Quest 3 profile)
npm run typecheck    # tsc --noEmit; run before testing
npm run test:unit    # 22 unit tests (detector, tag table, placement math, reset, convention)
npm run build        # production build -> dist/
```

**Testing on the Quest:**
- The network address for the Quest on the same Wi-Fi is printed when the server starts.
- Accept the local certificate warning; the dev server uses a development certificate.
- `npm run cert:lan` creates a certificate for the LAN address.

## How it works

Built with the [Immersive Web SDK](https://iwsdk.dev/) (IWSDK) `@iwsdk/core` 1.1.0, TypeScript, Vite and UIKitML panels. It is WebXR, so it runs from a link with no install.

| Path | What it is |
|---|---|
| `iwsdk.config.json` | Project authority: scene, AR, camera and XR features |
| `src/camera/tag-scanner-system.ts` | Scanner: picks the headset camera (not the virtual one), reads frames every 200 ms, opens the device |
| `src/markers/apriltag-detector.ts` | AprilTag detection with [js-aruco2](https://github.com/damianofalcioni/js-aruco2) (MIT), using a dictionary of the 12 printed `tag36h11` codes |
| `src/markers/tag-placement.ts` | Tag position in the world (pinhole model, 112 mm tag) and the facing pose of windows and virtual tags |
| `src/markers/apriltag-handshake.ts` | Tag id → device table and device descriptors |
| `src/devices/` | Device registry (single source of state, persisted locally), state convention, names and texts |
| `src/core/rules.ts` | Deterministic local rules (clamp + step) |
| `src/anchors/anchor-service.ts` | Binds `XRAnchor`s to device windows and restores them |
| `src/ui/` | Windows, HUD, telemetry, Settings, localization, sounds |
| `src/input/hand-ray-cursor.ts` | Hand-ray cursor with magnetic snap and trail |
| `public/ui/*.uikitml` | Panels: device windows, tag icons, scanner, Settings, telemetry |
| `src/locales/` | Interface texts, one file per language |
| `docs/ux/VISUAL_ID.md`, `docs/ux/DEVICE_CONVENTION.md` | Visual identity tokens ("cyan rests, amber acts") and the device state convention |
| `tests/anchor-roundtrip.md` | The anchor round-trip test: v1's definition of done, passed on Quest 3S and in the emulator |

## Key decisions

- **WebXR with IWSDK** instead of a native app (Meta Spatial SDK). Judges and users open a link; it fits the timeline and keeps the core idea.
- **AprilTag instead of QR code.** The tag carries only an id; what it means lives in the app.
- **The tag is read through the browser camera (`getUserMedia`), not the passthrough.** A web page cannot read the passthrough pixels it shows, but it can read the headset camera with permission.
- **Local-first:** settings, bindings and anchors stay on the headset, with no cloud.
- **Inspiration:** marker-based AR, the idea behind [this 2010 post](https://derkauf.wordpress.com/2010/03/12/augmented-reality/), now in a headset that maps the room.

## Project phases

Each milestone is frozen at a git tag and served unchanged at its own address, also listed in Settings › Project phases:

| Phase | What it added | Address |
|---|---|---|
| Phase 1 (tag `phase-1`) | Simulated tags, device windows, persistent anchors, EN/pt-BR | https://aura-phase1.sixvectors.app/ |
| Phase 2 (tag `phase-2`) | Quest-style HUD, full Settings, reliable pinch, 5 languages | https://aura-phase2.sixvectors.app/ |
| Phase 3 (this build) | Camera tag scanner, windows anchored at the printed tags, new visual identity, state convention | https://aura.sixvectors.app/ |
| Phase 4 (planned) | Deeper Mode, themes, spatial audio | — |
| Phase 5 (planned) | Real devices through Matter | — |

## Glossary

- **XR:** an immersive session, with the app running inside the headset or the emulator.
- **IWER:** IWSDK's in-browser XR emulator. It pretends to be a Quest, so you can test without a headset.
- **ECS (entity-component system):** how IWSDK organizes the app. Entities are things in the scene, components are their data, and systems are the behavior that runs every frame.
- **Spatial anchor:** a point in the room the headset remembers between sessions.
- **AprilTag:** a black-and-white marker a camera identifies by its id, created by the APRIL Robotics Lab at the University of Michigan.
- **Pinch:** thumb and index finger together, the select gesture with hand tracking.

---

By Diogo Kauf ([sixvectors](https://aura-home.sixvectors.app/)), with Lola.
