---
name: adding-game-features
description: >-
  Step-by-step patterns for adding new features to the Built to Automate game:
  new pickups, obstacles, visual effects, HUD elements, quiz questions, and UI
  overlays. Use when implementing new gameplay features or extending existing ones.
---

# Adding Game Features

## Adding a New Pickup Type

1. **Register in config**: Add to `PICKUP_TYPES` array and `PICKUP_SCORE` in `src/data/config.js`
2. **Build the mesh**: Add a `_makeXxxMesh()` method in `Spawner.js`, called from `_makePickupMesh()` switch
3. **Handle collection**: Add an `else if (t === "YOUR_TYPE")` branch in `Game.js` `_onPickup()`
4. **Wire scoring/effects**: Update score, play SFX, set status message in the same branch
5. **Update HUD legend**: Add a `.legend-row` in `index.html` and corresponding `.swatch-xxx` style in `style.css`
6. **Animate**: Add rotation logic in `Spawner.js` `_animatePickups(dt)` — use Y-axis only for flat/icon meshes

Pickup meshes use these conventions:
- **Flat icons** (Playbook, Collection): double-sided `PlaneGeometry` with loaded texture, Y-axis rotation only
- **3D shapes** (Shield): custom `ExtrudeGeometry` from `THREE.Shape`, Y-axis rotation only
- **Geometric** (Boost Token): `OctahedronGeometry`, rotates on X and Y

## Adding a New Obstacle Type

Currently only "Outage" exists. To add another:

1. Add a new `OBSTACLE_KIND_*` and `OBSTACLE_DAMAGE_*` in `config.js`
2. Extend `_makeObstacleMesh()` in `Spawner.js` with a new visual
3. Update `_onHitObstacle()` in `Game.js` for type-specific behavior
4. Keep obstacles **static** (no rotation) — `_animateObstacles()` is intentionally empty
5. Maintain fairness: at least 2 lanes must always be free per obstacle row

## Adding Visual Effects to the Player

The player car (`Player.js`) supports ring effects attached to `this.mesh`:

- **Flow ring**: `TorusGeometry(1.35)` at `y=0.05`, green, spins clockwise
- **Shield ring**: `TorusGeometry(1.6)` at `y=0.3`, purple, spins counter-clockwise

Pattern for a new ring/effect:
1. Add a `_buildXxxEffect()` method creating a `THREE.Mesh`, set `opacity: 0`
2. Attach to `this.mesh` with `this.mesh.add(ring)`
3. Add `setXxxActive(on)` method toggling opacity
4. Animate in `update(dt)` only when `opacity > 0.01` (performance)
5. Call `setXxxActive()` from `Game.js` at the appropriate state transitions
6. Reset in `Game.js` `resetRun()`

**Avoid ring overlap**: vary radius and Y position so multiple simultaneous effects are visually distinct.

## Adding HUD Elements

1. Add HTML in `index.html` inside `.hud-left` (stats) or `.hud-right` (status indicators)
2. Style in `style.css` — follow existing `.hud-pickup-counter` or `.hud-flow-progress` patterns
3. Cache the DOM element in `UI.js` constructor: `this.el.myThing = document.getElementById("hud-my-thing")`
4. Update in `UI.js` `updateHud()` — this is called every frame during `running` state
5. Pass new data from `Game.js` through the `updateHud()` call

## Adding Quiz Questions

Add entries to the array in `src/data/questions.js`:

```js
{
  q: "What module manages yum packages in Ansible?",
  options: ["yum", "apt", "pip", "npm"],
  answer: 0,          // index into options
  explain: "The yum module manages packages on RPM-based distributions."
}
```

`QuizSystem.js` auto-shuffles and cycles through all questions.

## Adding Sound Effects

1. Place the audio file in `assets/audio/`
2. Add a path constant in `Game.js` inside the `SFX` object
3. The file is auto-preloaded via `preload(Object.values(SFX))` in the constructor
4. Call `play(SFX.YOUR_SOUND, volume)` at the trigger point
5. For looping audio, use `startLoop(url, vol)` / `stopLoop()` from `audio.js`
6. For background music, use `startBgm(url, vol)` (separate from SFX muting)

Supported formats: `.wav`, `.mp3`, `.m4a`, `.mp4` (audio track)

## Adding UI Overlays (Menus / Dialogs)

1. Add HTML structure in `index.html` inside `#game-root`, using classes `overlay panel hidden`
2. Cache elements in `UI.js` constructor
3. Show/hide via `classList.toggle("hidden")` or `classList.add/remove`
4. Wire buttons in `UI.js` `_bindButtons()`, delegate callbacks through `setHandlers()`
5. Connect to game logic in `src/main.js` where handlers are registered

## Modifying the Skyline

The distant skyline is built in `Track.js` `_skyline()`:
- Generic buildings: randomized block geometry with emissive window patterns
- Red Hat HQ: specific branded building at `x=22`
- The skyline group sits at a fixed Z and does NOT scroll (parallax-static)
- Increase `emissiveIntensity` if buildings aren't visible through fog
- Keep building heights low enough that tops aren't clipped by the camera
