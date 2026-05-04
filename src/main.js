import * as THREE from "three";
import { Game } from "./game/Game.js";
import { UI } from "./game/UI.js";
import { getLastLevel, getLastDriver, getDeathStarTrenchUnlocked } from "./utils/storage.js";
import { getLevelIdFromPathname, syncThemeUrl } from "./utils/themePath.js";
import { toggleMusicMute, toggleSfxMute } from "./utils/audio.js";
import { loadQuestions } from "./data/questions.js";

await loadQuestions();

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
// Slightly lifted so silhouettes separate from the void (was pure black crush)
scene.background = new THREE.Color(0x0a0e18);
scene.fog = new THREE.Fog(0x0a0e18, 48, 175);

const camera = new THREE.PerspectiveCamera(
  58,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 5.2, 12);

const ui = new UI();
const game = new Game(renderer, scene, camera, ui);

ui.setHandlers({
  onStart: () => game.startFromMenu(),
  onResume: () => game.resume(),
  onRestart: () => game.startFromMenu(),
  onMenu: () => game.backToMenu(),
  onSaveScore: () => game.saveScore(),
  onRecoveryYes: () => game.onRecoveryYes(),
  onRecoveryNo: () => game.onRecoveryNo(),
  onUnstick: () => game.forceUnstick(),
  onBillboardClose: () => game.closeBillboard(),
  onTouchPause: () => {
    if (game.state === "running") {
      game.state = "paused";
      ui.showPause(true);
    }
  },
  onHudInfoOpen: () => {
    if (game.state === "running") {
      game.state = "paused";
    }
    ui.openMobileHud();
  },
  onMobileSecret: () => game.triggerSecret(),
  onHudInfoClose: () => {
    ui.closeMobileHud();
    if (game.state === "paused") {
      game.state = "running";
      ui.showPause(false);
    }
  },
  onQuizSkip: () => game.skipQuiz(),
  onLevelSelect: (levelId, returnTo) => {
    game.switchLevel(levelId, returnTo);
    syncThemeUrl(levelId, "push");
  },
  onDriverSelect: (driverId) => game.selectDriver(driverId),
  onSaveScoreLc: () => game.saveLcScore(),
  onSkipTutorial: () => game.skipTutorial(),
  onTutorialGotIt: () => game.tutorialGotIt(),
});

ui.setActiveDriver(getLastDriver());

const levelFromUrl = getLevelIdFromPathname();
let initialLevel = levelFromUrl ?? getLastLevel();
if (!getDeathStarTrenchUnlocked() && initialLevel === "DS") {
  initialLevel = getLastLevel();
  if (initialLevel === "DS") initialLevel = "A";
}
game.switchLevel(initialLevel);
syncThemeUrl(initialLevel, levelFromUrl ? "skip" : "replace");

window.addEventListener("popstate", () => {
  let id = getLevelIdFromPathname() ?? getLastLevel();
  if (!getDeathStarTrenchUnlocked() && id === "DS") {
    id = getLastLevel();
    if (id === "DS") id = "A";
  }
  game.switchLevel(id);
  syncThemeUrl(id, "skip");
});

const btnMusic = document.getElementById("btn-music");
const btnSfx = document.getElementById("btn-sfx");
if (btnMusic) {
  btnMusic.addEventListener("click", () => {
    const muted = toggleMusicMute();
    btnMusic.classList.toggle("muted", muted);
    btnMusic.title = muted ? "Music off" : "Toggle music";
  });
}
if (btnSfx) {
  btnSfx.addEventListener("click", () => {
    const muted = toggleSfxMute();
    btnSfx.classList.toggle("muted", muted);
    btnSfx.title = muted ? "SFX off" : "Toggle sound effects";
  });
}

// Quiz toggle
const quizToggle = document.getElementById("quiz-toggle");
if (quizToggle) {
  quizToggle.addEventListener("change", () => {
    game.quizEnabled = quizToggle.checked;
  });
}

// Debug panel toggle
const btnDebugToggle = document.getElementById("btn-debug-toggle");
const debugTools = document.getElementById("debug-tools");
if (btnDebugToggle && debugTools) {
  btnDebugToggle.addEventListener("click", () => {
    const open = debugTools.classList.toggle("hidden");
    btnDebugToggle.classList.toggle("active", !open);
  });
}

const btnDevSkip = document.getElementById("btn-dev-skip");
if (btnDevSkip) {
  btnDevSkip.addEventListener("click", () => game.devSkipToFinish());
}


window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function frame() {
  requestAnimationFrame(frame);
  game.update();
  game.render();
}
requestAnimationFrame(frame);
