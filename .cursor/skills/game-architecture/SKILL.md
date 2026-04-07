---
name: game-architecture
description: >-
  Explains the architecture, state machine, and module responsibilities of the
  Built to Automate Three.js arcade game. Use when asking about game structure,
  how systems connect, debugging state issues, or understanding the codebase.
---

# Game Architecture

## Stack & Constraints

- Three.js r160 via CDN import map — **no build step, no bundler, no package.json**.
- Plain ES modules (`type="module"`). All imports use bare specifier `"three"` resolved by the import map in `index.html`.
- Static hosting on GitHub Pages. No backend. All persistence uses `localStorage`.

## Module Map

```
src/main.js          → bootstraps Three.js renderer, scene, camera; creates Game + UI; runs rAF loop
src/data/config.js   → CONFIG object: every tuning constant (speeds, damage, scoring, timing)
src/data/questions.js → quiz question bank (array of {q, options, answer, explain})
src/game/Game.js     → state machine, scoring, collision response, quiz flow, shield/boost/flow logic
src/game/Player.js   → F1 car mesh (THREE.Group of primitives), lane lerp, visual rings (flow, shield)
src/game/Track.js    → road, lane markers, side props, distant skyline, lighting; all scroll in update()
src/game/Spawner.js  → obstacle/pickup generation, mesh builders, animation, fair-lane logic
src/game/CollisionSystem.js → AABB hit detection between player box and entity boxes
src/game/QuizSystem.js      → shuffled question pool, next-question selection, answer checking
src/game/UI.js       → manages all HTML overlays (HUD, menus, quiz, recovery, leaderboard)
src/utils/audio.js   → Web Audio for one-shot SFX; HTML <audio> for loops (engine, BGM); mute toggles
src/utils/storage.js → localStorage get/set for best score, leaderboard (top 50), seen-tips, settings
```

## State Machine

States: `boot → main_menu → running → quiz → paused → game_over`

Key transitions in `Game.js`:
- `main_menu → running`: `startFromMenu()` — resets run, starts engine loop
- `running → quiz`: hitting a boost token or choosing "Yes" on recovery prompt
- `quiz → running`: after quiz result display timer (`QUIZ_RESULT_DISPLAY_MS`)
- `running → paused`: Escape/Space while running
- `running → game_over`: health reaches 0

**Quiz flow has two phases**: `_quizPhase = 'question' | 'result'`. The game fully pauses during both. A 30s safety timer (`_startQuizSafetyTimer`) auto-resets if quiz gets stuck.

## Config is the Single Source of Truth

All magic numbers live in `src/data/config.js`. When tuning gameplay:
- Speed: `BASE_SPEED`, `SPEED_RAMP`, `BOOST_SPEED_MULT`
- Health: `STARTING_HEALTH`, `OBSTACLE_DAMAGE`, `REMEDIATION_RESTORE`
- Scoring: `SCORE_PER_SECOND`, `PICKUP_SCORE.*`, `BOOST_QUIZ_CORRECT`
- Timing: `QUIZ_RESULT_DISPLAY_MS`, `STATUS_HIT_MS`, `BOOST_DURATION`
- Spawning: `MIN_OBSTACLE_ALONG_Z`, `OBSTACLE_SPAWN_BASE/MIN`, `PICKUP_SPAWN_BASE/MIN`

Never scatter numeric literals in game code — import from CONFIG.

## Collision Detection

`CollisionSystem.js` uses AABB (axis-aligned bounding boxes). The `HIT` object defines hitbox dimensions per entity type. The obstacle `d` (depth) value is intentionally larger than the visual mesh to trigger hits ~0.25s early for better audio-visual sync.

## Common Pitfalls

1. **Quiz stuck state**: Always call `_resetQuizFlags()` when transitioning out of quiz. The safety timer catches edge cases.
2. **CSS specificity**: Overlays use `.overlay` class for `position: absolute`. Never add `position` to ID selectors like `#quiz-overlay` — it overrides the class rule due to higher specificity.
3. **Material disposal**: Three.js materials are cloned per mesh in `Player.js` and `Spawner.js`. Always `.dispose()` the template materials after cloning, and dispose clones in `dispose()` methods.
4. **Obstacle fairness**: `_pickLaneForObstacle()` ensures at least 2 lanes are always free. Never spawn obstacles that create unavoidable patterns.
