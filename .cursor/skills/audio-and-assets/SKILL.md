---
name: audio-and-assets
description: >-
  Patterns for managing audio, textures, and visual assets in the Built to
  Automate game. Use when adding sounds, images, icons, or troubleshooting
  asset loading, audio timing, or mute controls.
---

# Audio & Assets

## Audio System (`src/utils/audio.js`)

Three separate audio channels, each independently controlled:

| Channel | API | Use case | Mute control |
|---------|-----|----------|--------------|
| **SFX** | Web Audio (`AudioContext` + `AudioBuffer`) | One-shot effects (hit, pickup, correct/wrong) | `toggleSfxMute()` — also pauses engine loop |
| **Engine loop** | HTML `<audio>` element | Continuous car engine rumble during runs | Muted with SFX toggle |
| **BGM** | Separate HTML `<audio>` element | Background music, always playing | `toggleMusicMute()` — independent from SFX |

### Audio Unlock

Browsers block audio until user gesture. `audio.js` exports `unlock()` which resumes the `AudioContext`. This is called on first user interaction in `main.js`.

### Adding a New Sound Effect

```js
// In Game.js, add to the SFX object:
const SFX = {
  // ... existing entries
  MY_SOUND: "./assets/audio/my-sound.wav",
};

// Preload happens automatically via:
preload(Object.values(SFX));

// Play at the trigger point:
play(SFX.MY_SOUND, 0.7); // second arg is volume 0-1
```

### Audio Timing

Collision sounds may feel delayed because the collision box matches the visual mesh exactly. To make sounds feel earlier, increase the `d` (depth) property in `CollisionSystem.js` `HIT` object. The obstacle `d` is set to 4.2 to trigger ~0.25s before visual overlap at typical game speeds.

## Texture Assets

Pickup icons use PNG textures loaded via `THREE.TextureLoader` in `Spawner.js`:

```js
const loader = new THREE.TextureLoader();
this._playbookTex = loader.load("./assets/playbook-icon.png");
this._collectionTex = loader.load("./assets/collection-icon.png");
```

Applied to double-sided `PlaneGeometry` with `map` and `transparent: true` for clean edges.

### Adding a New Icon Texture

1. Place the PNG in `assets/` (keep it small, ~64-256px, transparent background)
2. Load in `Spawner.js` constructor alongside existing textures
3. Create a `PlaneGeometry` mesh with `MeshStandardMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })`
4. For HUD legend, add an `<img class="swatch-icon">` in `index.html`

## Audio File Conventions

- Place all audio in `assets/audio/`
- Short SFX: `.wav` preferred (no decode latency)
- Longer audio (music, loops): `.m4a` or `.mp4` (compressed, smaller file)
- Keep SFX under 1 second for gameplay responsiveness
- BGM should loop cleanly (the HTML audio element handles `loop` natively)

## Mute Button UI

Toggle buttons live in `index.html` `#audio-controls` (fixed top-right). State is toggled in `main.js` event listeners. The `.muted` CSS class dims the button. Button text uses Unicode: `♫` for music, `🔈` for SFX.
