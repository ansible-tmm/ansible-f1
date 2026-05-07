import * as THREE from "three";
import { CONFIG, LEVELS, DRIVERS, TUTORIAL_STEPS, TUTORIAL_SPAWN_Z, TUTORIAL_TIP_Z, TUTORIAL_QUIZ_QUESTION } from "../data/config.js";
import { Player } from "./Player.js";
import { Track } from "./Track.js";
import { Spawner } from "./Spawner.js";
import { CollisionSystem } from "./CollisionSystem.js";
import { QuizSystem } from "./QuizSystem.js";
import {
  setBestScoreIfHigher,
  addTotalCorrectAnswers,
  incrementTotalRuns,
  getBestScore,
  hasSeenRecoveryTip,
  markRecoveryTipSeen,
  addLeaderboardEntry,
  getLastName,
  setLastName,
  getLastCountry,
  setLastCountry,
  setLastLevel,
  getLastDriver,
  setLastDriver,
  getDeathStarTrenchUnlocked,
  setDeathStarTrenchUnlocked,
  loadAchievements,
  unlockAchievement,
  ACHIEVEMENT_DEFS,
} from "../utils/storage.js";
import {
  preload,
  play,
  playWithOnEnded,
  startLoop,
  stopLoop,
  startBgm,
  playFinaleBed,
  stopFinaleBed,
} from "../utils/audio.js";
import { submitGlobalScore } from "../utils/firebase.js";
import { GodzillaMode } from "./GodzillaMode.js";
import { syncThemeUrl } from "../utils/themePath.js";

const SFX = {
  SHIELD_HIT: "./assets/audio/shield-hit.wav",
  SHIELD_ON: "./assets/audio/shield-on.wav",
  OBSTACLE_HIT: "./assets/audio/obstacle-hit.wav",
  BOOST_WHOOSH: "./assets/audio/boost-whoosh.wav",
  CORRECT: "./assets/audio/correct.m4a",
  WRONG: "./assets/audio/wrong.mp4",
  PICKUP: "./assets/audio/pickup.wav",
  GAME_OVER: "./assets/audio/game-over.wav",
  START_RUN: "./assets/audio/start-run.wav",
  HORN: "./assets/audio/horn.m4a",
  HORN_ANDRIUS: "./assets/audio/horn-andrius.m4a",
  CROWD_CHEERS: "./assets/audio/crowd-cheers.mp4",
  HIPPO_MODE: "./assets/audio/hippo-mode.m4a",
  HIPPO_BLAH_1: "./assets/audio/hippo-blah-1.m4a",
  HIPPO_BLAH_2: "./assets/audio/hippo-blah-2.m4a",
  HIPPO_BLAH_3: "./assets/audio/hippo-blah-3.m4a",
  HIPPO_BLAH_4: "./assets/audio/hippo-blah-4.m4a",
  DELOREAN: "./assets/audio/delorean.m4a",
  TRAIN_WHISTLE: "./assets/audio/train-whistle.m4a",
  TRAIN_35MPH: "./assets/audio/train-35mph.m4a",
  TRAIN_45MPH: "./assets/audio/train-45mph.m4a",
  TRAIN_WHISTLE_ALT: "./assets/audio/train-whistle-alt.m4a",
  TRAIN_EXPLOSION: "./assets/audio/train-explosion.m4a",
  TRAIN_FINALE: "./assets/audio/train-finale.m4a",
  SCALONETA: "./assets/audio/scaloneta.m4a",
  OGRE_GRUNT_1: "./assets/audio/ogre-grunt-1.mp4",
  OGRE_GRUNT_2: "./assets/audio/ogre-grunt-2.mp4",
  CROONER_1: "./assets/audio/decal.m4a",
  CROONER_2: "./assets/audio/love_it.m4a",
  CROONER_3: "./assets/audio/driving_crooner.m4a",
  CROONER_4: "./assets/audio/make_money.m4a",
  CROONER_5: "./assets/audio/right_next_to_me.m4a",
  COUNTDOWN: "./assets/audio/countdown.m4a",
  XWING_TAKEOFF: "./assets/audio/starwars-ship-takeoff.m4a",
  XWING_LASER: "./assets/audio/xwing_blast.m4a",
  /** Death Star trench — one-shot at 25% run progress (not tutorial). */
  DS_ALMOST_THERE: "./assets/audio/almost_there.m4a",
  /** Death Star trench — one-shot at 50% run progress (not tutorial). */
  DS_USE_THE_FORCE: "./assets/audio/use_the_force.m4a",
  /** Death Star trench — one-shot at 75% run progress (not tutorial). */
  DS_R2D2: "./assets/audio/r2d2.m4a",
  /** Death Star trench — when the exit / finish arch first spawns ahead (not tutorial). */
  DS_BLOW_THIS_THING: "./assets/audio/blow_this_thing.m4a",
  /** Chained after DS_BLOW_THIS_THING ends — proton torpedo moment. */
  DS_FINAL_SHOT: "./assets/audio/final_shot.m4a",
  /** Death Star finale — when the sphere detonates (same moment as boom mesh). */
  DS_DEATH_STAR_EXPLOSION: "./assets/audio/death_star_explosion.m4a",
  /** Death Star finale escape shot — cut at explosion; hand off to DS_DEATH_STAR_EXPLOSION. */
  DS_FINAL_SCENE: "./assets/audio/final_scene_starwars.m4a",
};

const ENGINE_LOOP = "./assets/audio/engine-loop.mp4";
const ENGINE_LOOP_XWING = "./assets/audio/xwing-engine.m4a";
const DEFAULT_BGM = "./assets/audio/bgm.m4a";
const QUEST_BGM = "./assets/audio/quest-bgm.mp3";

preload([...Object.values(SFX), ENGINE_LOOP, ENGINE_LOOP_XWING]);

/** World −Z = trench “forward”; bolts are not parented to the scrolling track. */
const XWING_BOLT_SPEED = 218;
const XWING_BOLT_LIFE_MS = 520;
/** Trench finish portal — must match Track.spawnFinishLine (circle / exhaust port). */
const DS_FINISH_PORTAL_Y = 0.11;
const DS_FINISH_PORTAL_Z_LOCAL = 0.18;
const DS_PROTON_TORPEDO_SPEED = 108;
const _TORP_AXIS_Y = new THREE.Vector3(0, 1, 0);
const _TORP_DIR = new THREE.Vector3();

/**
 * @typedef {'boot'|'main_menu'|'running'|'quiz'|'paused'|'game_over'|'billboard'|'godzilla'} GameState
 */

const ES = {
  "Go!": "¡Vamos!",
  "Resumed — keep driving!": "¡Seguimos manejando!",
  "Manual boost!": "¡Turbo manual!",
  "Correct: Speed Boost": "¡Correcto: Turbo!",
  "Boost extended! Keep it going!": "¡Turbo extendido! ¡Dale!",
  "Wrong answer": "Respuesta incorrecta",
  "Automation Flow active": "¡Flujo de automatización activo!",
  "Shield Active!": "¡Escudo activo!",
  "Speed Boost!": "¡Turbo!",
  "Boost Extended!": "¡Turbo extendido!",
  "Smashed right through it!": "¡Lo destrozó!",
  "Plowed right through!": "¡Lo pasó por encima!",
  "Checkered flag ahead — finish is near!": "¡Bandera a cuadros — la meta está cerca!",
  "COMBO": "COMBO",
  "CLOSE CALL!": "¡POR POCO!",
  "Playbook": "Playbook",
  "Collection": "Colección",
  "Score:": "Puntos:",
  "Obstacles": "Obstáculos",
  "Pickups": "Recolectados",
  "Correct": "Correctas",
  "Level Complete!": "¡Nivel completo!",
  "Game Over": "Fin del juego",
  "Paused": "Pausado",
  "Resume": "Continuar",
  "Restart Run": "Reiniciar",
  "Main Menu": "Menú principal",
  "Health": "Salud",
  "Score": "Puntos",
  "Speed": "Velocidad",
  "Boost": "Turbo",
  "Shield: ON": "Escudo: SÍ",
  "Shield: —": "Escudo: —",
  "Skill Check": "Prueba de habilidad",
  "CORRECT!": "¡CORRECTO!",
  "WRONG": "INCORRECTO",
  "Play Again": "Jugar de nuevo",
  "Back to Menu": "Volver al menú",
  "⭐ +500 Interactive Experience": "⭐ +500 Experiencia interactiva",
  "Flow": "Flujo",
  "Playbooks": "Playbooks",
  "Collections": "Colecciones",
  "Fixes": "Reparaciones",
  "Finish": "Meta",
  "Shield: —": "Escudo: —",
  "Shield: ON": "Escudo: SÍ",
  "⚡ Flow active — 1.2× score": "⚡ Flujo activo — 1.2× puntos",
  "Flow: —": "Flujo: —",
  "Click a billboard to continue the tutorial":
    "Haz clic en un cartel para seguir con el tutorial",
  "TIE destroyed! +120": "¡TIE destruido! +120",
  "Turbolaser hit! +90": "¡Turboláser! +90",
};

export class Game {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.Scene} scene
   * @param {THREE.PerspectiveCamera} camera
   * @param {import('./UI.js').UI} ui
   */
  constructor(renderer, scene, camera, ui) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.ui = ui;

    this.state = /** @type {GameState} */ ("boot");
    this.quizMode = /** @type {'boost'|'recovery'|null} */ (null);
    this.currentQuestion = null;

    this.currentLevel = "A";
    this.currentDriver = getLastDriver();
    const carType = (DRIVERS[this.currentDriver] || DRIVERS.anshul).car;
    this.player = new Player(scene, carType);
    this.track = new Track(scene, this.currentLevel);
    this.spawner = new Spawner(scene);
    this.collision = new CollisionSystem(this.player);
    this.quiz = new QuizSystem();

    this.runTime = 0;
    this.health = CONFIG.STARTING_HEALTH;
    this.score = 0;
    this.streak = 0;
    this.worldSpeed = CONFIG.BASE_SPEED;

    this.shield = false;
    this.boostUntil = 0;
    this._boostStartedAt = 0;
    this.automationFlowUntil = 0;

    this.manualBoostUntil = 0;
    this.manualBoostCooldownUntil = 0;
    this.braking = false;

    this.obstaclesHit = 0;
    this.pickupsCollected = 0;
    this.sessionCorrect = 0;
    this.playbookCount = 0;
    this.playbookPts = 0;
    this.collectionCount = 0;
    this.collectionPts = 0;
    this.pickupSpeedMult = 1;
    this._lastCheaterPopupTs = 0;

    this.recoveryPrompt = false;
    this.remediationsUsed = 0;
    this.timeScale = 1;

    // Combo multiplier
    this.comboCount = 0;
    this.comboTimer = 0;

    // Near-miss tracking
    this._nearMissChecked = new Set();

    // Interactive tutorial
    this.tutorialMode = false;
    this._tutorialStep = 0;
    this._tutorialPaused = false;
    this._tutorialEntity = null;
    this._tutorialSpawned = false;
    this._tutorialBannerShown = false;
    this._tutorialBillboardIntroShown = false;
    /** @type {number|null} */
    this._tutorialBillboardNudgeAt = null;
    this._tutorialBillboardNudgeShown = false;

    /** @type {{ mesh: THREE.Mesh, until: number }[]} */
    this._xwingLaserBolts = [];
    this._xwingFireCooldownUntil = 0;
    /** Next S-foil cannon (0–3) for alternating single shots. */
    this._xwingCannonIndex = 0;

    // Quiz toggle
    this.quizEnabled = true;

    // Achievements
    this._achievements = loadAchievements();
    this._runBoostCount = 0;
    this._runMaxCombo = 0;

    // Speed tier FOV
    this._baseFov = 58;

    this.cameraBase = new THREE.Vector3(0, 5.2, 12);
    this.shakeUntil = 0;
    this.shakeAmp = 0;

    // Billboard interaction
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._dragMoved = false;
    this._pointerDown = null;
    this._hoveredBillboard = null;
    this._activeBillboard = null;
    this._bbTargetPos = new THREE.Vector3();
    this._bbTargetLook = new THREE.Vector3();
    this._bbCurrentLook = new THREE.Vector3(0, 1.2, -2);
    this._bbZooming = false;
    this._bbOverlayShown = false;
    this._bbReturning = false;
    this._bbLabel = "";
    this._bbDef = null;
    /** @type {"running"|"main_menu"} Where to return after closing a billboard demo */
    this._bbReturnState = "running";
    this._demoCompleted = new Set();

    // Level completion
    this._finishLineSpawned = false;
    this._finishing = false;
    this._finishCoastSpeed = 0;
    this._dsFinishBreakawayT = 0;
    this._dsAlmostTherePlayed = false;
    this._dsUseTheForcePlayed = false;
    this._dsR2d2Played = false;
    /** Cancels DS finish-line VO → torpedo chain if run resets mid-playback. */
    this._dsFinishSfxGeneration = 0;
    /** @type {{ mesh: THREE.Mesh, speed: number }[]} */
    this._dsProtonTorpedoes = [];
    this._orbitStartTime = 0;
    this._orbitCenter = new THREE.Vector3();
    this._lcOverlayShown = false;
    this._lcOverlayDelayMs = 3000;
    /** After a finished DS trench run, next `backToMenu` locks DS and returns to highway + URL. */
    this._revertFromDeathStarComplete = false;
    /** @type {THREE.Group|null} */
    this._dsFinaleGroup = null;
    /** @type {THREE.Mesh|null} */
    this._dsFinaleBoom = null;
    /** @type {THREE.Points|null} */
    this._dsFinaleParticles = null;
    /** @type {THREE.Object3D|null} */
    this._dsFinaleDsMesh = null;
    /** Trench / entities hidden during DS finale; restored in cleanup. */
    this._dsFinalePrevVis = null;
    /** @type {THREE.Color|THREE.Texture|null} */
    this._dsSceneBgRestore = null;
    /** Camera easing into the static “escape” shot. */
    this._dsFinaleCamFrom = new THREE.Vector3();
    this._dsFinaleLookFrom = new THREE.Vector3();
    /** @type {{ near: number, far: number }|null} */
    this._dsFogRestore = null;
    this._celebCrowd = [];
    this._celebConfetti = [];
    this._secretBuffer = "";
    this._globalSecretBuffer = "";

    this._godzillaMode = new GodzillaMode(scene, camera);

    // Attract mode (demo play behind main menu)
    this._attractActive = false;
    this._attractDodgeTimer = 0;
    this._attractSpeed = CONFIG.BASE_SPEED * 0.85;
    this._gameOverTimer = null;
    this._attractScoreFlashTimer = null;
    this._attractScoreShowing = false;
    /** Virtual run time for menu attract spawns — capped so density matches early run, not post-warmup. */
    this._attractSpawnElapsed = 0;

    this._lastTs = performance.now();

    this._bindKeys();
    this._bindQuizUi();
    this._bindBillboardInput();
    this._bindTouch();
    this._bindHorn();
    this._quizBusy = false;
    /** @type {'question'|'result'} */
    this._quizPhase = "question";
  }

  _tryUnlockDeathStarTrench() {
    setDeathStarTrenchUnlocked(true);
    this.ui.syncDeathStarTrenchCardVisibility();
    this.ui.refreshLevelSelectPreviews();
    this.ui.showHippoCrush("DEATH STAR TRENCH UNLOCKED");
    play(SFX.BOOST_WHOOSH, 0.85);
    this.switchLevel("DS", "main_menu");
    syncThemeUrl("DS", "push");
  }

  _applyDeathStarRunVehicle() {
    if (this.currentLevel === "DS") {
      this.player.swapCar("xwing");
    }
  }

  _bindKeys() {
    window.addEventListener("keydown", (e) => {
      if (this.state === "godzilla") {
        if (e.code === "Escape") {
          this._exitGodzilla();
          e.preventDefault();
        }
        return;
      }

      if (e.key.length === 1) {
        this._globalSecretBuffer = (this._globalSecretBuffer + e.key.toLowerCase()).slice(-12);
        if (this._globalSecretBuffer.endsWith("godzilla")) {
          this._globalSecretBuffer = "";
          this._enterGodzilla();
          return;
        }
        if (this._globalSecretBuffer.endsWith("starwars")) {
          this._globalSecretBuffer = "";
          if (!getDeathStarTrenchUnlocked()) {
            this._tryUnlockDeathStarTrench();
          } else if (this.currentLevel !== "DS") {
            this.switchLevel("DS", "main_menu");
            syncThemeUrl("DS", "push");
          }
          return;
        }
      }

      if (this.state === "main_menu" && this._attractScoreShowing) {
        this._attractScoreShowing = false;
        this.ui.showAttractScores(false);
        return;
      }
      if (this.state === "main_menu" || this.state === "game_over") return;

      if (this.state === "billboard") {
        if (e.code === "Escape" || e.code === "Backspace") {
          this.closeBillboard();
          e.preventDefault();
        }
        return;
      }

      if (
        this.state === "quiz" &&
        this._quizPhase === "question" &&
        this.currentQuestion
      ) {
        if (e.code === "Escape" || e.code === "Backspace") {
          this.skipQuiz();
          e.preventDefault();
          return;
        }
        const k = e.key;
        if (k >= "1" && k <= "4") {
          this._answerQuiz(Number(k) - 1);
          e.preventDefault();
        }
        return;
      }

      if (this.state === "quiz" && this._quizPhase === "result") {
        if (e.code === "Escape" || e.code === "Backspace") {
          this._dismissResult(this._lastAnswerCorrect);
          e.preventDefault();
        }
        return;
      }

      if (this.state === "quiz") return;

      if (e.code === "Escape" || e.code === "Backspace") {
        if (this.recoveryPrompt) {
          this.onRecoveryNo();
        } else if (this.state === "paused") {
          this.state = "running";
          this.ui.showPause(false);
        } else if (this.state === "running") {
          this.state = "paused";
          this.ui.showPause(true);
        }
        e.preventDefault();
      }

      if (e.code === "Space" && this.state === "running") {
        this._hornOrVehicleAction();
        e.preventDefault();
        return;
      }

      if (this.state !== "running" || this.recoveryPrompt) return;
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        this.player.moveLeft();
        e.preventDefault();
      }
      if (e.code === "KeyD" || e.code === "ArrowRight") {
        this.player.moveRight();
        e.preventDefault();
      }
      if (e.code === "KeyW" || e.code === "ArrowUp") {
        this._activateManualBoost();
        e.preventDefault();
      }
      if (e.code === "KeyS" || e.code === "ArrowDown") {
        this.braking = true;
        e.preventDefault();
      }

      if (this.state === "running" && e.key.length === 1) {
        this._secretBuffer = (this._secretBuffer + e.key.toLowerCase()).slice(-12);
        if (this.currentDriver === "nuno" && this.player.carType !== "hippo" && this._secretBuffer.endsWith("hippo")) {
          this._spawnTransformSmoke();
          this.player.swapCar("hippo");
          this.ui.showHippoAnnounce();
          play(SFX.HIPPO_MODE, 0.9);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "matt" && this.player.carType !== "skateboard" && this._secretBuffer.endsWith("skate")) {
          this._spawnTransformSmoke();
          this.player.swapCar("skateboard");
          this.ui.showHippoCrush("🛹 SKATE MODE 🛹");
          play(SFX.CORRECT, 0.9);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "andrius" && this.player.carType !== "semi_truck" && this._secretBuffer.endsWith("chunky")) {
          this._spawnTransformSmoke();
          this.player.swapCar("semi_truck");
          this.ui.showHippoCrush("🚛 CHUNKY MODE 🚛");
          play(SFX.HORN_ANDRIUS, 0.9);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "leo" && this.player.carType !== "scaloneta" && this._secretBuffer.endsWith("scaloneta")) {
          this._spawnTransformSmoke();
          this.player.swapCar("scaloneta");
          this.ui.showHippoCrush("🇦🇷 LA SCALONETA 🇦🇷");
          play(SFX.SCALONETA, 0.9);
          this.ui.setScalonetaHud(true);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "alex" && this.player.carType !== "f16" && this._secretBuffer.endsWith("topgun")) {
          this._spawnTransformSmoke();
          this.player.swapCar("f16");
          this.ui.showHippoCrush("✈️ TOP GUN MODE ✈️");
          play(SFX.BOOST_WHOOSH, 0.9);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "anshul" && this.player.carType !== "trex" && this._secretBuffer.endsWith("leavemealone")) {
          this._spawnTransformSmoke();
          this.player.swapCar("trex");
          this.ui.showHippoCrush("🦖 T-REX MODE 🦖");
          play(SFX.OBSTACLE_HIT, 0.9);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "remy" && this.player.carType !== "ogre" && this._secretBuffer.endsWith("quest")) {
          this._spawnTransformSmoke();
          this.player.swapCar("ogre");
          this.ui.showHippoCrush("🧌 OGRE MODE 🧌");
          this._playOgreSfx(0.9);
          this.track.setCastle(true);
          startBgm(QUEST_BGM, 0.15);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "justin" && this.player.carType !== "crooner" && this._secretBuffer.endsWith("crooner")) {
          this._spawnTransformSmoke();
          this.player.swapCar("crooner");
          this._primeCroonerSfxBuffers();
          this.ui.showHippoCrush("🎤 THE DRIVING<br>CROONER 🎤");
          this._playCroonerSfx(0.9);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "roger" && this.player.carType !== "timetrain" && this._secretBuffer.endsWith("crossfit")) {
          this._spawnTransformSmoke();
          this.player.swapCar("timetrain");
          this._trainHitCount = 0;
          this.ui.showHippoCrush("🚂 TIME TRAIN<br>MODE 🚂");
          play(SFX.TRAIN_WHISTLE, 0.9);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "hicham" && this.player.carType !== "bicycle" && this._secretBuffer.endsWith("leafs")) {
          this._spawnTransformSmoke();
          this.player.swapCar("bicycle");
          this.ui.showHippoCrush("🚲 LEAFS MODE 🚲");
          play(SFX.BOOST_WHOOSH, 0.9);
          this._secretBuffer = "";
        }
        if (this.currentDriver === "aubrey" && this.player.carType !== "cadillac" && this._secretBuffer.endsWith("hollywood")) {
          this._spawnTransformSmoke();
          this.player.swapCar("cadillac");
          this.ui.showHippoCrush("🌟 HOLLYWOOD MODE 🌟");
          play(SFX.BOOST_WHOOSH, 0.9);
          this._rainbowRoad = true;
          this.track.setRainbow(true);
          this._secretBuffer = "";
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "KeyS" || e.code === "ArrowDown") {
        this.braking = false;
      }
    });
  }

  triggerSecret() {
    if (this.state !== "running") return;
    const d = this.currentDriver;
    const ct = this.player.carType;
    const secrets = {
      nuno:    { car: "hippo",     label: "🦛 HIPPO MODE 🦛",           sfx: SFX.HIPPO_MODE },
      matt:    { car: "skateboard", label: "🛹 SKATE MODE 🛹",          sfx: SFX.CORRECT },
      andrius: { car: "semi_truck", label: "🚛 CHUNKY MODE 🚛",        sfx: SFX.HORN_ANDRIUS },
      leo:     { car: "scaloneta",  label: "🇦🇷 LA SCALONETA 🇦🇷",      sfx: SFX.SCALONETA, extra: () => this.ui.setScalonetaHud(true) },
      alex:    { car: "f16",        label: "✈️ TOP GUN MODE ✈️",        sfx: SFX.BOOST_WHOOSH },
      anshul:  { car: "trex",       label: "🦖 T-REX MODE 🦖",         sfx: SFX.OBSTACLE_HIT },
      remy:    { car: "ogre",       label: "🧌 OGRE MODE 🧌",          sfx: null, extra: () => { this._playOgreSfx(0.9); this.track.setCastle(true); startBgm(QUEST_BGM, 0.15); } },
      justin:  { car: "crooner",    label: "🎤 THE DRIVING<br>CROONER 🎤", sfx: null, extra: () => this._playCroonerSfx(0.9) },
      roger:   { car: "timetrain",  label: "🚂 TIME TRAIN<br>MODE 🚂",  sfx: SFX.TRAIN_WHISTLE, extra: () => { this._trainHitCount = 0; } },
      hicham:  { car: "bicycle",    label: "🚲 LEAFS MODE 🚲",         sfx: SFX.BOOST_WHOOSH },
      aubrey:  { car: "cadillac",   label: "🌟 HOLLYWOOD MODE 🌟",     sfx: SFX.BOOST_WHOOSH, extra: () => { this._rainbowRoad = true; this.track.setRainbow(true); } },
    };
    const s = secrets[d];
    if (!s || ct === s.car) return;
    this._spawnTransformSmoke();
    this.player.swapCar(s.car);
    if (s.car === "crooner") this._primeCroonerSfxBuffers();
    if (d === "nuno") { this.ui.showHippoAnnounce(); } else { this.ui.showHippoCrush(s.label); }
    if (s.sfx) play(s.sfx, 0.9);
    if (s.extra) s.extra();
    this._secretBuffer = "";
  }

  _enterGodzilla() {
    if (this.state === "godzilla") return;
    this._preGodzillaState = this.state;

    if (this._attractActive) this._stopAttractMode();
    stopLoop();

    const hidden = [];
    if (this.player.mesh) hidden.push(this.player.mesh);
    if (this.track && this.track.group) hidden.push(this.track.group);
    for (const e of this.spawner.obstacles) if (e.mesh) hidden.push(e.mesh);
    for (const e of this.spawner.pickups) if (e.mesh) hidden.push(e.mesh);

    this.ui.hideAll();
    this.state = "godzilla";
    this._godzillaMode.enter(hidden);
    this.ui.showGodzillaHud(true);
  }

  _exitGodzilla() {
    const finalScore = this._godzillaMode.score;
    const finalCrushed = this._godzillaMode.crushed;
    const totalBuildings = this._godzillaMode.totalBuildings;
    const bossResult = this._godzillaMode._bossResult;
    this._godzillaMode.exit();
    this.ui.showGodzillaHud(false);
    this.backToMenu();
    this.ui.showGodzillaScore(finalScore, finalCrushed, totalBuildings, bossResult);
  }

  _bindQuizUi() {
    const opts = this.ui.el.quizOpts;
    if (opts) {
      opts.addEventListener("click", (ev) => {
        if (
          this.state !== "quiz" ||
          this._quizPhase !== "question" ||
          !this.currentQuestion
        ) {
          return;
        }
        const t = /** @type {HTMLElement} */ (ev.target);
        if (t && t.dataset && t.dataset.index !== undefined) {
          this._answerQuiz(Number(t.dataset.index));
        }
      });
    }
  }

  _bindBillboardInput() {
    const c = this.renderer.domElement;
    c.addEventListener("pointerdown", (e) => {
      this._pointerDown = { x: e.clientX, y: e.clientY };
      this._dragMoved = false;
    });
    c.addEventListener("pointermove", (e) => {
      this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      if (this._pointerDown) {
        const dx = e.clientX - this._pointerDown.x;
        const dy = e.clientY - this._pointerDown.y;
        if (dx * dx + dy * dy > 25) this._dragMoved = true;
      }
      this._checkBillboardHover();
    });
    c.addEventListener("pointerup", () => {
      const canBillboard =
        this.state === "running" ||
        (this.state === "main_menu" && this.ui.isMainMenuBaseVisible());
      if (!this._dragMoved && this._hoveredBillboard && canBillboard && !this.recoveryPrompt) {
        if (!(this.tutorialMode && this._tutorialPaused)) {
          this._openBillboard(this._hoveredBillboard);
        }
      }
      this._pointerDown = null;
    });
  }

  _clearXwingLaserBolts() {
    for (const b of this._xwingLaserBolts) {
      this.scene.remove(b.mesh);
      b.mesh.geometry?.dispose();
      const m = b.mesh.material;
      if (m) {
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    }
    this._xwingLaserBolts.length = 0;
    this._xwingCannonIndex = 0;
  }

  _clearDsProtonTorpedoes() {
    for (const b of this._dsProtonTorpedoes) {
      this.scene.remove(b.mesh);
      b.mesh.geometry?.dispose();
      const m = b.mesh.material;
      if (m) {
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    }
    this._dsProtonTorpedoes.length = 0;
  }

  /** Two orange proton torpedoes from the X-wing toward the trench exhaust port (after VO). */
  _spawnDsProtonTorpedoesToFinish() {
    if (this.currentLevel !== "DS" || this.player.carType !== "xwing") return;
    if (this.track.getFinishZ() == null) return;
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff7700,
      emissive: 0xff5500,
      emissiveIntensity: 2.4,
      metalness: 0.28,
      roughness: 0.38,
      transparent: true,
      opacity: 0.96,
    });
    const hw = this.player.mesh;
    /** Under-fuselage launch points; +Z is aft in local space — tubes sit forward of wing root. */
    const localPts = [
      new THREE.Vector3(-0.26, 0.14, 0.42),
      new THREE.Vector3(0.26, 0.14, 0.42),
    ];
    const len = 0.72;
    const r0 = 0.1;
    const r1 = 0.13;
    const tz0 = this.track.getFinishZ() + DS_FINISH_PORTAL_Z_LOCAL;
    for (const lp of localPts) {
      const w = lp.clone();
      hw.localToWorld(w);
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(r0, r1, len, 12),
        mat.clone()
      );
      cap.position.copy(w);
      _TORP_DIR.set(-w.x, DS_FINISH_PORTAL_Y - w.y, tz0 - w.z).normalize();
      cap.quaternion.setFromUnitVectors(_TORP_AXIS_Y, _TORP_DIR);
      this.scene.add(cap);
      this._dsProtonTorpedoes.push({
        mesh: cap,
        speed: DS_PROTON_TORPEDO_SPEED,
      });
    }
  }

  _updateDsProtonTorpedoes(effDt) {
    if (!this._dsProtonTorpedoes.length) return;
    const fz = this.track.getFinishZ();
    if (fz == null) {
      this._clearDsProtonTorpedoes();
      return;
    }
    const tx = 0;
    const ty = DS_FINISH_PORTAL_Y;
    const tz = fz + DS_FINISH_PORTAL_Z_LOCAL;
    const hitR = 0.42;
    for (let i = this._dsProtonTorpedoes.length - 1; i >= 0; i--) {
      const b = this._dsProtonTorpedoes[i];
      const m = b.mesh;
      const dx = tx - m.position.x;
      const dy = ty - m.position.y;
      const dz = tz - m.position.z;
      const dist = Math.hypot(dx, dy, dz);
      const step = b.speed * effDt;
      if (dist <= hitR || dist <= step * 1.02) {
        this.scene.remove(m);
        m.geometry?.dispose();
        const mat = m.material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else mat.dispose();
        }
        this._dsProtonTorpedoes.splice(i, 1);
        continue;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      m.position.x += nx * step;
      m.position.y += ny * step;
      m.position.z += nz * step;
      _TORP_DIR.set(nx, ny, nz);
      m.quaternion.setFromUnitVectors(_TORP_AXIS_Y, _TORP_DIR);
    }
  }

  _updateXwingLaserBolts(effDt) {
    const now = performance.now();
    const pz = this.player.mesh.position.z;
    for (let i = this._xwingLaserBolts.length - 1; i >= 0; i--) {
      const b = this._xwingLaserBolts[i];
      b.mesh.position.z -= XWING_BOLT_SPEED * effDt;
      if (now > b.until || b.mesh.position.z < pz - 120) {
        this.scene.remove(b.mesh);
        b.mesh.geometry?.dispose();
        const m = b.mesh.material;
        if (m) {
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
        this._xwingLaserBolts.splice(i, 1);
      }
    }
  }

  /** @returns {{ kind: 'rival'|'obstacle', e: object }|null} */
  _pickXwingBlastTarget() {
    const px = this.player.mesh.position.x;
    const pz = this.player.mesh.position.z;
    const maxDz = -1.0;
    const minDz = -72;
    const maxDx = 2.35;
    let best = /** @type {{ kind: 'rival'|'obstacle', e: object, dz: number }|null} */ (null);
    for (const r of this.spawner.rivals) {
      if (!r.active) continue;
      const dz = r.mesh.position.z - pz;
      if (dz >= maxDz || dz < minDz) continue;
      if (Math.abs(r.mesh.position.x - px) > maxDx) continue;
      if (!best || dz > best.dz) best = { kind: "rival", e: r, dz };
    }
    for (const o of this.spawner.obstacles) {
      if (!o.active || o.subtype !== "OUTAGE") continue;
      const dz = o.mesh.position.z - pz;
      if (dz >= maxDz || dz < minDz) continue;
      if (Math.abs(o.mesh.position.x - px) > maxDx) continue;
      if (!best || dz > best.dz) best = { kind: "obstacle", e: o, dz };
    }
    return best ? { kind: best.kind, e: best.e } : null;
  }

  _spawnXwingLaserBolts() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0xff4400,
      emissiveIntensity: 2.2,
      metalness: 0.2,
      roughness: 0.35,
      transparent: true,
      opacity: 0.92,
    });
    const until = performance.now() + XWING_BOLT_LIFE_MS;
    const hw = this.player.mesh;
    const boltLen = 5.2;
    const half = boltLen * 0.5;
    const tips = hw.userData?.xwingBarrelTips;
    /** Fallback if mesh predates wingtip barrels (nose −Z). */
    const localPts = [
      new THREE.Vector3(-1.16, 0.68, -0.12),
      new THREE.Vector3(1.16, 0.68, -0.12),
      new THREE.Vector3(-1.16, -0.02, -0.12),
      new THREE.Vector3(1.16, -0.02, -0.12),
    ];
    const n = tips?.length === 4 ? 4 : localPts.length;
    const idx = this._xwingCannonIndex % n;
    this._xwingCannonIndex = (this._xwingCannonIndex + 1) % n;
    const w =
      tips?.length === 4
        ? tips[idx].clone()
        : localPts[idx].clone();
    hw.localToWorld(w);
    const bolt = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, boltLen),
      mat.clone(),
    );
    bolt.position.set(w.x, w.y, w.z - half);
    this.scene.add(bolt);
    this._xwingLaserBolts.push({ mesh: bolt, until });
  }

  _fireXwingBlasters() {
    const now = performance.now();
    if (now < this._xwingFireCooldownUntil) return;
    this._xwingFireCooldownUntil = now + 240;

    this._spawnXwingLaserBolts();
    play(SFX.XWING_LASER, 0.82);

    const hit = this._pickXwingBlastTarget();
    if (hit) {
      if (hit.kind === "rival") {
        this.spawner.explodeRival(hit.e);
        this.score += 120;
        this.ui.showPickupPopup(this._t("TIE destroyed! +120"));
      } else {
        this.spawner.explodeObstacle(hit.e);
        this.score += 90;
        this.ui.showPickupPopup(this._t("Turbolaser hit! +90"));
      }
      play(SFX.OBSTACLE_HIT, 0.45);
    }
  }

  /** Horn / vehicle click action — same for canvas click and Space bar while running. */
  _hornOrVehicleAction() {
    if (this.state !== "running") return;
    /** Trench: always turbolasers (including during remediation — avoids horn fallback). */
    if (this.currentLevel === "DS" && this.player.carType === "xwing") {
      this._fireXwingBlasters();
      return;
    }
    if (this.player.carType === "skateboard") {
      this.player.skateJump();
      play(SFX.BOOST_WHOOSH, 0.6);
      return;
    }
    if (this.player.carType === "f16") {
      this._dropBomb();
      return;
    }
    if (this.player.carType === "delorean") {
      if (this.player.startTimeTravel()) {
        play(SFX.DELOREAN, 0.9);
        const lines = [
          "⚡ 88 MPH!!! ⚡",
          "⚡ 1.21 GIGAWATTS! ⚡",
          "⚡ GREAT SCOTT! ⚡",
          "⚡ BACK IN TIME! ⚡",
          "⚡ FLUX CAPACITOR<br>FLUXING! ⚡",
          "⚡ WHERE WE'RE GOING<br>WE DON'T NEED ROADS ⚡",
          "⚡ TEMPORAL<br>DISPLACEMENT! ⚡",
          "⚡ HEAVY! ⚡",
        ];
        this.ui.showHippoCrush(lines[Math.floor(Math.random() * lines.length)]);
      } else if (this.player.ttCooldownRemaining > 0) {
        this.ui.setStatus(this._isScaloneta
          ? `¡Capacitor recargando... ${Math.ceil(this.player.ttCooldownRemaining)}s!`
          : `Flux capacitor recharging... ${Math.ceil(this.player.ttCooldownRemaining)}s`, 1000);
      }
      return;
    }
    if (this.player.carType === "hippo") {
      play(SFX.HIPPO_MODE, 0.9);
    } else if (this.player.carType === "timetrain") {
      play(SFX.TRAIN_WHISTLE, 0.9);
    } else if (this.player.carType === "ogre") {
      this._playOgreSfx(0.9);
    } else if (this.player.carType === "crooner") {
      this._playCroonerSfx(0.9);
    } else if (this.player.carType === "scaloneta") {
      play(SFX.SCALONETA, 0.8);
    } else if (this.currentDriver === "andrius") {
      play(SFX.HORN_ANDRIUS, 0.8);
    } else {
      play(SFX.HORN, 0.8);
    }
  }

  _bindHorn() {
    this.renderer.domElement.addEventListener("click", () => {
      this._hornOrVehicleAction();
    });
  }

  _bindTouch() {
    if (!("ontouchstart" in window)) return;

    const canvas = this.renderer.domElement;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartTime = performance.now();
    }, { passive: true });

    canvas.addEventListener("touchend", (e) => {
      if (e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const elapsed = performance.now() - touchStartTime;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Swipe detection: > 30px and faster than 300ms
      if (dist > 30 && elapsed < 300) {
        if (this.state === "running" && !this.recoveryPrompt) {
          if (Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) this.player.moveLeft();
            else this.player.moveRight();
          } else if (Math.abs(dy) > Math.abs(dx) * 1.5) {
            if (dy < 0) this._activateManualBoost();
          }
        }
        e.preventDefault();
        return;
      }

      // Tap detection: short distance, quick tap
      if (dist < 15 && elapsed < 250) {
        if (this.state === "running" && !this.recoveryPrompt) {
          const half = window.innerWidth / 2;
          if (t.clientX < half) this.player.moveLeft();
          else this.player.moveRight();
        } else if (this.state === "running" && this.recoveryPrompt) {
          // ignore taps during recovery
        } else if (this.state === "paused") {
          this.state = "running";
          this.ui.showPause(false);
        }
      }
    }, { passive: false });
  }

  _checkBillboardHover() {
    const canHover =
      this.state === "running" ||
      (this.state === "main_menu" && this.ui.isMainMenuBaseVisible());
    if (!canHover || this.recoveryPrompt) {
      this.renderer.domElement.style.cursor = "";
      this._hoveredBillboard = null;
      return;
    }
    this._raycaster.setFromCamera(this._mouse, this.camera);
    const meshes = this.track.getBillboardMeshes();
    const hits = this._raycaster.intersectObjects(meshes, false);
    if (hits.length) {
      this._hoveredBillboard = hits[0].object.userData._billboardId || null;
      this.renderer.domElement.style.cursor = "pointer";
    } else {
      this._hoveredBillboard = null;
      this.renderer.domElement.style.cursor = "";
    }
  }

  _openBillboard(id) {
    this._tutorialBillboardNudgeAt = null;
    this._tutorialBillboardNudgeShown = false;
    this.ui.hideTutorialBillboardNudge();
    this._bbReturnState = this.state === "main_menu" ? "main_menu" : "running";
    this._activeBillboard = id;
    this.state = "billboard";
    this._bbZooming = true;
    this._bbOverlayShown = false;
    this._bbReturning = false;

    const bb = this.track.billboards[id];
    if (!bb) return;

    const pos = bb.position;
    const faceDir = pos.x < 0 ? 1 : -1;
    const faceY = bb.userData.faceCenterY ?? 7.5;
    this._bbTargetPos.set(
      pos.x + faceDir * 5.5,
      pos.y + faceY + 1.4,
      pos.z + 11
    );
    this._bbTargetLook.set(pos.x, pos.y + faceY, pos.z);
    this._bbCurrentLook.set(
      this.camera.position.x * 0.2,
      1.2,
      -2
    );

    const theme = LEVELS[this.currentLevel];
    const bbDef = theme && theme.billboards.find((b) => b.id === id);
    this._bbLabel = bbDef ? bbDef.label : id;
    this._bbDef = bbDef || null;
  }

  closeBillboard() {
    if (this._bbReturning) return;

    const demoId = this._activeBillboard;
    const tutorialBillboardStep =
      this.tutorialMode &&
      TUTORIAL_STEPS[this._tutorialStep]?.kind === "billboard";

    if (demoId && !this._demoCompleted.has(demoId)) {
      this._demoCompleted.add(demoId);
      this.score += 500;
      this.ui.showPickupPopup("+500");
      this.ui.setStatus(this._t("⭐ +500 Interactive Experience"), 2500);
      play(SFX.CORRECT, 0.7);
    }

    if (tutorialBillboardStep) {
      this._advanceTutorialStep(null);
    }

    this.ui.showBillboard(false);
    this._bbReturning = true;
    this._bbOverlayShown = false;
    this._bbDef = null;

    const px = this.player.mesh.position.x;
    this._bbTargetPos.set(px * 0.35, this.cameraBase.y, this.cameraBase.z);
    this._bbTargetLook.set(px * 0.2, 1.2, -2);
  }

  startFromMenu() {
    this._revertFromDeathStarComplete = false;
    this._stopAttractMode();
    clearTimeout(this._gameOverTimer);
    this.resetRun();
    this._applyDeathStarRunVehicle();

    const isDs = this.currentLevel === "DS";
    if (isDs) {
      this.tutorialMode = false;
      this._tutorialPaused = true;
      this._tutorialStep = 0;
      this._tutorialEntity = null;
      this._tutorialSpawned = false;
      this._tutorialBannerShown = false;
      this._tutorialSpawnDelay = 0;
      this._tutorialTipShown = false;
      this._tutorialQuizActive = false;
      this._tutorialWaitingForBrake = false;
      this._tutorialEntityWasHit = false;
      this._tutorialHitPending = false;
      this._tutorialPickupCollected = false;
      this._tutorialBillboardIntroShown = false;
      this._tutorialBillboardNudgeAt = null;
      this._tutorialBillboardNudgeShown = false;
      this.spawner.scriptedMode = false;
    } else {
      this.tutorialMode = true;
      this._tutorialStep = 0;
      this._tutorialPaused = false;
      this._tutorialEntity = null;
      this._tutorialSpawned = false;
      this._tutorialBannerShown = false;
      this._tutorialSpawnDelay = 0;
      this._tutorialTipShown = false;
      this._tutorialQuizActive = false;
      this._tutorialWaitingForBrake = false;
      this._tutorialEntityWasHit = false;
      this._tutorialHitPending = false;
      this._tutorialPickupCollected = false;
      this._tutorialBillboardIntroShown = false;
      this._tutorialBillboardNudgeAt = null;
      this._tutorialBillboardNudgeShown = false;
      this.spawner.scriptedMode = true;
    }

    this.state = "running";
    this.ui.showMainMenu(false);
    this.ui.showGameOver(false);
    this.ui.showLevelComplete(false);
    this.ui.showPause(false);
    this.ui.showHud(true);
    this.ui.setScalonetaHud(this._isScaloneta);
    if (this.player.carType === "crooner") this._primeCroonerSfxBuffers();
    if (isDs) {
      this.ui.hideAllTutorialUI();
      this.ui.showSkipTutorial(false);
    } else {
      this.ui.showSkipTutorial(true);
      this.ui.showTutorialBanner();
      this.ui.buildTutorialChecklist(TUTORIAL_STEPS);
      this.ui.showTutorialChecklist(true);
    }
    /** DS trench: only countdown audio during 3-2-1; engine + takeoff after “Go!”. */
    const dsXwingCountdown = isDs && this.player.carType === "xwing";

    if (this.player.carType === "xwing") {
      if (!dsXwingCountdown) {
        play(SFX.XWING_TAKEOFF, 0.88);
      }
    } else {
      play(SFX.START_RUN, 0.75);
    }
    if (!dsXwingCountdown) {
      startLoop(
        this.player.carType === "xwing" ? ENGINE_LOOP_XWING : ENGINE_LOOP,
        0.2,
      );
    }

    if (isDs) {
      play(SFX.COUNTDOWN, 0.8);
      this.ui.showTutorialCountdown(() => {
        this._tutorialPaused = false;
        this.ui.setStatus(this._t("Go!"), 1500);
        if (dsXwingCountdown) {
          play(SFX.XWING_TAKEOFF, 0.88);
          startLoop(ENGINE_LOOP_XWING, 0.2);
        }
      });
    }
  }

  resetRun() {
    this._cleanupDeathStarFinale();
    incrementTotalRuns();
    this._resetQuizFlags();
    this.quizMode = null;
    this.currentQuestion = null;
    this.quiz.resetPool();
    this.spawner.reset();
    this.spawner.levelId = this.currentLevel;
    this.runTime = 0;
    this.health = CONFIG.STARTING_HEALTH;
    this.score = 0;
    this.streak = 0;
    this.worldSpeed = CONFIG.BASE_SPEED;
    this.shield = false;
    this.player.setShieldActive(false);
    this.boostUntil = 0;
    this._boostStartedAt = 0;
    this.automationFlowUntil = 0;
    this.manualBoostUntil = 0;
    this.manualBoostCooldownUntil = 0;
    this.braking = false;
    this.obstaclesHit = 0;
    this.pickupsCollected = 0;
    this.sessionCorrect = 0;
    this.playbookCount = 0;
    this.playbookPts = 0;
    this.collectionCount = 0;
    this.collectionPts = 0;
    this.pickupSpeedMult = 1;
    this._lastCheaterPopupTs = 0;
    this.recoveryPrompt = false;
    this.remediationsUsed = 0;
    this.timeScale = 1;
    this._resetComboOverlay();
    this._nearMissChecked.clear();
    this._demoCompleted.clear();
    this._clearXwingLaserBolts();
    this._runBoostCount = 0;
    this._runMaxCombo = 0;
    this._finishLineSpawned = false;
    this._finishing = false;
    this._finishCoastSpeed = 0;
    this._dsFinishBreakawayT = 0;
    this._dsAlmostTherePlayed = false;
    this._dsUseTheForcePlayed = false;
    this._dsR2d2Played = false;
    this._dsFinishSfxGeneration++;
    this._clearDsProtonTorpedoes();
    if (this.player) this.player._finishBreakawayEase = null;
    this._cleanupCelebration();
    this._cleanupBombs();
    this._cleanupTransformSmoke();
    this.track.removeFinishLine();
    this.player.targetLaneIndex = 1;
    this.player.laneIndex = 1;
    this.player.mesh.position.x = CONFIG.LANES[1];
    this.player.mesh.visible = true;
    this.player._curveX = 0;
    this.player.resetCelebrationPose();
  }

  resume() {
    this.state = "running";
    this.ui.showPause(false);
  }

  restartFromPause() {
    this.ui.showPause(false);
    this.startFromMenu();
  }

  // ─── Interactive tutorial ───

  _tutorialUpdate(now) {
    if (!this.tutorialMode || this._tutorialPaused) return;

    const step = TUTORIAL_STEPS[this._tutorialStep];
    if (!step) { this._endTutorial(); return; }

    // Wait for the banner to finish before spawning the first entity
    if (!this._tutorialBannerShown) {
      this._tutorialBannerShown = true;
      this._tutorialSpawnDelay = now + 2500;
      return;
    }
    if (now < this._tutorialSpawnDelay) return;

    if (step.kind === "billboard") {
      if (this.currentLevel === "DS") {
        this._advanceTutorialStep(null);
        return;
      }
      if (!this._tutorialBillboardIntroShown) {
        this._tutorialBillboardIntroShown = true;
        this._tutorialPaused = true;
        const cx = this.renderer.domElement.clientWidth / 2;
        const cy = this.renderer.domElement.clientHeight * 0.36;
        this.ui.showTutorialTip(cx, cy, step.tip);
      } else if (
        !this._tutorialPaused &&
        this.state === "running" &&
        this._tutorialBillboardNudgeAt != null
      ) {
        if (
          !this._tutorialBillboardNudgeShown &&
          now >= this._tutorialBillboardNudgeAt
        ) {
          this._tutorialBillboardNudgeShown = true;
          this._tutorialBillboardNudgeAt = null;
          this.ui.showTutorialBillboardNudge(
            this._t("Click a billboard to continue the tutorial"),
          );
        }
        if (this._tutorialBillboardNudgeShown) {
          this.ui.updateTutorialBillboardNudge(
            this._tutorialBillboardNudgeScreenPos(),
          );
        }
      }
      return;
    }

    if (step.kind === "lesson") {
      if (!this._tutorialWaitingForBrake) {
        this._showTutorialTipOnPlayer(step.tip);
      } else if (this.braking) {
        this.ui.setStatus("Nice braking!", 1500);
        this._advanceTutorialStep();
      }
      return;
    }

    if (!this._tutorialSpawned) {
      this._tutorialSpawned = true;
      const lane = step.lane;
      const z = TUTORIAL_SPAWN_Z;
      if (step.kind === "pickup") {
        this._tutorialEntity = this.spawner.forceSpawnPickup(step.type, lane, z);
      } else if (step.kind === "obstacle") {
        this._tutorialEntity = this.spawner.forceSpawnObstacle(step.type, lane, z);
      }
    }

    if (this._tutorialEntity && this._tutorialEntity.active) {
      const ez = this._tutorialEntity.mesh.position.z;
      if (ez > TUTORIAL_TIP_Z && !this._tutorialTipShown) {
        this._tutorialTipShown = true;
        this._tutorialPaused = true;
        const pos = this._entityScreenPos(this._tutorialEntity);
        this.ui.showTutorialTip(pos.x, pos.y - 20, step.tip);
      }
    } else if (this._tutorialEntity && !this._tutorialEntity.active) {
      if (step.kind === "pickup" && !this._tutorialPickupCollected) {
        play(SFX.WRONG, 0.7);
        this.ui.setStatus("You missed it! Try again — steer into it.", 2000);
        this._tutorialSpawned = false;
        this._tutorialEntity = null;
        this._tutorialTipShown = false;
        this._tutorialSpawnDelay = performance.now() + 1200;
        return;
      }
      if (step.kind === "obstacle" && step.mustHit && !this._tutorialEntityWasHit) {
        play(SFX.WRONG, 0.7);
        this.ui.setStatus("You dodged it! Hit the Outage to use your Shield.", 2200);
        this._tutorialSpawned = false;
        this._tutorialEntity = null;
        this._tutorialTipShown = false;
        this._tutorialSpawnDelay = performance.now() + 1200;
        return;
      }
      if (step.kind === "obstacle" && !step.mustHit && !this._tutorialEntityWasHit) {
        this.ui.setStatus("Great dodge! You avoided the Outage!", 1800);
      }
      this._tutorialEntityWasHit = false;
      this._tutorialPickupCollected = false;
      this._advanceTutorialStep();
    }
  }

  _showTutorialTipOnPlayer(text) {
    this._tutorialPaused = true;
    const pos = this._entityScreenPos({ mesh: this.player.mesh });
    this.ui.showTutorialTip(pos.x, pos.y - 40, text);
  }

  _entityScreenPos(entity) {
    const v = new THREE.Vector3();
    entity.mesh.getWorldPosition(v);
    v.project(this.camera);
    const hw = this.renderer.domElement.clientWidth / 2;
    const hh = this.renderer.domElement.clientHeight / 2;
    return { x: (v.x * hw) + hw, y: -(v.y * hh) + hh };
  }

  /** Screen position for tutorial “point at billboard” nudge (center of a themed board face). */
  _tutorialBillboardNudgeScreenPos() {
    const theme = LEVELS[this.currentLevel];
    const list = theme?.billboards;
    const w = this.renderer.domElement.clientWidth;
    const h = this.renderer.domElement.clientHeight;
    const fallback = { x: w * 0.72, y: h * 0.38 };
    if (!list?.length) return fallback;
    const idx = list.length >= 2 ? 1 : 0;
    const id = list[idx].id;
    const g = this.track.billboards[id];
    if (!g) return fallback;
    const faceY = g.userData.faceCenterY ?? 10;
    const v = new THREE.Vector3(0, faceY, 0.5);
    v.applyMatrix4(g.matrixWorld);
    v.project(this.camera);
    const hw = w / 2;
    const hh = h / 2;
    return { x: (v.x * hw) + hw, y: -(v.y * hh) + hh };
  }

  _advanceTutorialStep(sfx = SFX.CORRECT) {
    this._tutorialStep += 1;
    this._tutorialSpawned = false;
    this._tutorialEntity = null;
    this._tutorialPickupCollected = false;
    this._tutorialPaused = false;
    this._tutorialTipShown = false;
    this._tutorialWaitingForBrake = false;
    this._tutorialBillboardIntroShown = false;
    this._tutorialBillboardNudgeAt = null;
    this._tutorialBillboardNudgeShown = false;
    this.ui.hideTutorialBillboardNudge();
    this.ui.hideTutorialTip();
    if (sfx) play(sfx, 0.6);
    this.ui.tutorialCheckStep(this._tutorialStep, TUTORIAL_STEPS.length);
    if (this._tutorialStep >= TUTORIAL_STEPS.length) {
      this._endTutorial();
    } else {
      this._tutorialSpawnDelay = performance.now() + 600;
    }
  }

  tutorialGotIt() {
    if (!this.tutorialMode || !this._tutorialPaused) return;
    this.ui.hideTutorialTip();

    if (this._tutorialHitPending) {
      this._tutorialHitPending = false;
      this._advanceTutorialStep(null);
      return;
    }

    const step = TUTORIAL_STEPS[this._tutorialStep];
    if (step && step.type === "BRAKE") {
      this._tutorialPaused = false;
      this._tutorialWaitingForBrake = true;
      this.ui.setStatus("Press S or ↓ now!", 30000);
      return;
    }

    if (step?.kind === "billboard") {
      this._tutorialBillboardNudgeAt = performance.now() + 15000;
      this._tutorialBillboardNudgeShown = false;
    } else {
      this._tutorialBillboardNudgeAt = null;
      this._tutorialBillboardNudgeShown = false;
    }

    this._tutorialPaused = false;
  }

  skipTutorial() {
    if (!this.tutorialMode) return;
    this._endTutorial();
  }

  _endTutorial() {
    this.tutorialMode = false;
    this._tutorialPaused = true;
    this.spawner.scriptedMode = false;
    this.score = 0;
    this.playbookCount = 0;
    this.playbookPts = 0;
    this.collectionCount = 0;
    this.collectionPts = 0;
    this.pickupsCollected = 0;
    this.obstaclesHit = 0;
    this.shield = false;
    this.player.setShieldActive(false);
    this.ui.hideAllTutorialUI();
    play(SFX.COUNTDOWN, 0.8);
    this.ui.showTutorialCountdown(() => {
      this._tutorialPaused = false;
      this.ui.setStatus(this._t("Go!"), 1500);
    });
  }

  /** One-off after completing Death Star trench: lock secret level, default to AIOps, fix theme URL. */
  _applyDeathStarRunCompleteReturnToHighway() {
    if (!this._revertFromDeathStarComplete) return;
    this._revertFromDeathStarComplete = false;
    setDeathStarTrenchUnlocked(false);
    const fallback = "A";
    this.currentLevel = fallback;
    setLastLevel(fallback);
    this.spawner.levelId = fallback;
    this.track.dispose();
    this.track = new Track(this.scene, fallback);
    const t = LEVELS[fallback];
    if (t) {
      this.scene.background = new THREE.Color(t.sceneBg);
      this.scene.fog = new THREE.Fog(t.fog, 48, 175);
    }
    this.ui.setActiveLevel(fallback);
    this.ui.syncDeathStarTrenchCardVisibility();
    this.ui.refreshLevelSelectPreviews();
    syncThemeUrl(fallback, "replace");
  }

  backToMenu() {
    this._clearXwingLaserBolts();
    this._resetComboOverlay();
    this.state = "main_menu";
    this.recoveryPrompt = false;
    this.timeScale = 1;
    this.tutorialMode = false;
    this._tutorialPaused = false;
    this.spawner.scriptedMode = false;
    this.ui.hideAllTutorialUI();
    this._activeBillboard = null;
    clearTimeout(this._gameOverTimer);
    this._cleanupDeathStarFinale();
    this._cleanupCelebration();
    this.player.resetCelebrationPose();
    stopLoop();

    this._applyDeathStarRunCompleteReturnToHighway();

    const d = DRIVERS[this.currentDriver];
    if (d && this.player.carType !== d.car) {
      this.player.swapCar(d.car);
    }
    if (this.player.carType === "crooner") this._primeCroonerSfxBuffers();
    this.ui.setScalonetaHud(false);
    this._rainbowRoad = false;
    this.track.setRainbow(false);
    this.track.setCastle(false);

    const theme = LEVELS[this.currentLevel];
    startBgm(theme?.music || DEFAULT_BGM, 0.1);

    this.ui.showBillboard(false);
    this.ui.showGameOver(false);
    this.ui.showLevelComplete(false);
    this.ui.showPause(false);
    this.ui.showQuiz(false);
    this.ui.showRecovery(false, false);
    this.ui.showLevelSelect(false);
    this.ui.showDriverSelect(false);
    this.ui.showHud(false);
    this.ui.showMainMenu(true);
    this.ui.updateMenuBest(getBestScore());
    this.ui.syncDeathStarTrenchCardVisibility();
    this._startAttractMode();

    if (theme && theme.billboards) {
      this.ui.preloadBillboardEmbeds(theme.billboards);
    }
  }

  switchLevel(levelId, returnTo = "main_menu") {
    if (!LEVELS[levelId]) return;
    this._revertFromDeathStarComplete = false;
    if (levelId === "DS" && !getDeathStarTrenchUnlocked()) return;
    if (this.currentLevel === "DS" && levelId !== "DS") {
      setDeathStarTrenchUnlocked(false);
      this.ui.syncDeathStarTrenchCardVisibility();
    }
    this.currentLevel = levelId;
    setLastLevel(levelId);
    this.spawner.levelId = levelId;

    this.track.dispose();
    this.track = new Track(this.scene, levelId);

    const theme = LEVELS[levelId];
    if (theme) {
      this.scene.background = new THREE.Color(theme.sceneBg);
      /** DS: fade only in the far distance so the trench doesn’t read as a gray “cloud bank”. */
      const fogNear = levelId === "DS" ? 110 : 48;
      const fogFar = levelId === "DS" ? 520 : 175;
      this.scene.fog = new THREE.Fog(theme.fog, fogNear, fogFar);
    }

    startBgm(theme.music || DEFAULT_BGM, 0.1);

    this.ui.setActiveLevel(levelId);
    this.backToMenu();
  }

  selectDriver(driverId) {
    const d = DRIVERS[driverId];
    if (!d) return;
    this.currentDriver = driverId;
    setLastDriver(driverId);
    this.player.swapCar(d.car);
    if (d.car === "crooner") this._primeCroonerSfxBuffers();
    this.ui.setActiveDriver(driverId);
  }

  /**
   * Emergency un-stick: tears down whatever overlay is blocking and returns to running.
   * Bound to the persistent escape-hatch button in the bottom-right.
   */
  forceUnstick() {
    if (this.state === "main_menu" || this.state === "game_over") return;
    if (this.state === "billboard") { this.closeBillboard(); return; }
    this.recoveryPrompt = false;
    this.timeScale = 1;
    this._resetQuizFlags();
    this.quizMode = null;
    this.currentQuestion = null;
    this.ui.showQuiz(false);
    this.ui.showRecovery(false, false);
    this.ui.showPause(false);
    this.state = "running";
    this.ui.setStatus(this._t("Resumed — keep driving!"), CONFIG.STATUS_MESSAGE_MS);
  }

  _answerQuiz(optionIndex) {
    if (
      this.state !== "quiz" ||
      this._quizPhase !== "question" ||
      !this.currentQuestion ||
      this._quizBusy
    ) {
      return;
    }
    this._quizBusy = true;
    this._quizPhase = "result";
    this.ui.stopQuizCountdown();
    const q = this.currentQuestion;
    const ok = this.quiz.isCorrect(q, optionIndex);
    this._lastAnswerCorrect = ok;

    if (ok) play(SFX.CORRECT, 0.8);
    else play(SFX.WRONG, 0.8);

    const { title, lines } = this._quizResultCopy(ok);

    if (!ok) {
      const correctText = q.options[q.answer];
      lines.push(this._isScaloneta ? `Respuesta correcta: ${correctText}` : `Correct answer: ${correctText}`);
    }

    this.ui.showQuizResult(ok, title, lines, q.explanation);

    const displayMs = ok ? CONFIG.QUIZ_RESULT_DISPLAY_MS : 3000;
    if (!ok) {
      this.ui.startResultCountdown(3);
    }
    clearTimeout(this._quizResultTimer);
    this._quizResultTimer = setTimeout(() => {
      this._dismissResult(ok);
    }, displayMs);
  }

  /**
   * Reward copy shown on result screen (gameplay still paused until _finishQuiz).
   */
  _quizResultCopy(ok) {
    const mode = this.quizMode;
    const fm = this._flowMult();
    const lines = [];
    const s = this._isScaloneta;

    if (mode === "boost") {
      if (ok) {
        const pts = Math.floor(CONFIG.BOOST_QUIZ_CORRECT * fm);
        const nextStreak = this.streak + 1;
        lines.push(
          s ? `${CONFIG.BOOST_DURATION}s de turbo — vas más rápido (mirá la Velocidad)`
            : `${CONFIG.BOOST_DURATION}s speed boost — you move forward faster (watch the Speed readout)`
        );
        lines.push(s
          ? `+${pts} puntos${fm > 1 ? " (Flujo de automatización ×1.2 aplicado)" : ""}`
          : `+${pts} score${fm > 1 ? " (Automation Flow ×1.2 applied)" : ""}`);
        lines.push(s
          ? `Racha → ${nextStreak} (3 correctas activa Flujo de automatización)`
          : `Streak → ${nextStreak} (3 correct triggers Automation Flow)`);
        if (nextStreak >= CONFIG.STREAK_FOR_FLOW) {
          lines.push(
            s ? "Siguiente: Flujo de automatización — 8s puntos ×1.2 + imán de recolectables"
              : "Next: Automation Flow — 8s score ×1.2 + pickup magnet + glow"
          );
        }
        return { title: s ? "¡CORRECTO!" : "CORRECT!", lines };
      }
      const cons = Math.floor(CONFIG.BOOST_QUIZ_WRONG * fm);
      lines.push(s ? `+${cons} puntos de consolación` : `+${cons} consolation score only`);
      lines.push(s ? "Sin turbo esta vez" : "No speed boost this time");
      lines.push(s ? "Racha reiniciada a 0" : "Streak reset to 0");
      return { title: s ? "INCORRECTO" : "WRONG", lines };
    }

    if (mode === "recovery") {
      if (ok) {
        const nextStreak = this.streak + CONFIG.REMEDIATION_CORRECT_STREAK;
        lines.push(s ? `+${CONFIG.REMEDIATION_RESTORE} salud (máximo 100)` : `+${CONFIG.REMEDIATION_RESTORE} health (toward max 100)`);
        lines.push(s ? `Racha → ${nextStreak}` : `Streak → ${nextStreak}`);
        if (nextStreak >= CONFIG.STREAK_FOR_FLOW) {
          lines.push(
            s ? "Flujo de automatización se activa — 8s puntos ×1.2 + imán"
              : "Automation Flow will trigger — 8s score ×1.2 + pickup magnet"
          );
        }
        return { title: s ? "¡CORRECTO!" : "CORRECT!", lines };
      }
      const after = this.health - CONFIG.REMEDIATION_WRONG_PENALTY;
      lines.push(s ? `−${CONFIG.REMEDIATION_WRONG_PENALTY} salud` : `−${CONFIG.REMEDIATION_WRONG_PENALTY} health`);
      lines.push(s ? "Racha reiniciada a 0" : "Streak reset to 0");
      if (after <= 0) {
        lines.push(s ? "Salud en 0 — la carrera termina después de esta pantalla" : "Health at 0 — run ends after this screen");
      }
      return { title: s ? "INCORRECTO" : "WRONG", lines };
    }

    return { title: ok ? (s ? "¡CORRECTO!" : "CORRECT!") : (s ? "INCORRECTO" : "WRONG"), lines };
  }

  _dismissResult(ok) {
    clearTimeout(this._quizResultTimer);
    this.ui.stopResultCountdown();
    this._finishQuiz(ok);
    this._quizBusy = false;
    this._quizPhase = "question";
    clearTimeout(this._quizSafetyTimer);
  }

  _finishQuiz(correct) {
    const mode = this.quizMode;
    this.ui.showQuiz(false);
    this.state = "running";
    this.quizMode = null;
    this.currentQuestion = null;
    this.timeScale = 1;

    if (this._tutorialQuizActive) {
      this._tutorialQuizActive = false;
      this.ui.showTutorialChecklist(true);
      if (correct) {
        play(SFX.BOOST_WHOOSH, 0.85);
        this.ui.setStatus("Nice! That's how boost quizzes work.", 2000);
      }
      this._advanceTutorialStep();
      return;
    }

    if (mode === "boost") {
      if (correct) {
        this.streak += 1;
        this.score += CONFIG.BOOST_QUIZ_CORRECT * this._flowMult();
        this.sessionCorrect += 1;
        addTotalCorrectAnswers(1);
        const now = performance.now();
        const stacking = now < this.boostUntil;
        const base = stacking ? this.boostUntil : now;
        if (!stacking) this._boostStartedAt = now;
        this.boostUntil = base + CONFIG.BOOST_DURATION * 1000;
        this._runBoostCount += 1;
        play(SFX.BOOST_WHOOSH, 0.85);
        this.ui.setStatus(
          stacking ? this._t("Boost extended! Keep it going!") : this._t("Correct: Speed Boost"),
          CONFIG.STATUS_MESSAGE_MS
        );
        this._checkStreakAutomation();
      } else {
        this.streak = 0;
        this.score += CONFIG.BOOST_QUIZ_WRONG * this._flowMult();
        this.ui.setStatus(this._t("Wrong answer"), CONFIG.STATUS_MESSAGE_MS);
      }
    } else if (mode === "recovery") {
      this.remediationsUsed += 1;
      const left = CONFIG.MAX_REMEDIATIONS - this.remediationsUsed;
      if (correct) {
        this.health = Math.min(
          CONFIG.STARTING_HEALTH,
          this.health + CONFIG.REMEDIATION_RESTORE
        );
        this.streak += CONFIG.REMEDIATION_CORRECT_STREAK;
        this.sessionCorrect += 1;
        addTotalCorrectAnswers(1);
        this.ui.setStatus(
          this._isScaloneta
            ? `¡Salud restaurada! (${left} remediación${left !== 1 ? "es" : ""} restante${left !== 1 ? "s" : ""})`
            : `Health restored! (${left} remediation${left !== 1 ? "s" : ""} left)`,
          CONFIG.STATUS_MESSAGE_MS
        );
        this._checkStreakAutomation();
      } else {
        this.streak = 0;
        this.health -= CONFIG.REMEDIATION_WRONG_PENALTY;
        this.ui.setStatus(
          this._isScaloneta
            ? `¡Remediación fallida! (${left} restante${left !== 1 ? "s" : ""})`
            : `Remediation failed (${left} left)`,
          CONFIG.STATUS_MESSAGE_MS
        );
        if (this.health <= 0) {
          this._gameOver();
          return;
        }
      }
    }
  }

  _checkStreakAutomation() {
    if (this.streak >= CONFIG.STREAK_FOR_FLOW) {
      this.streak = 0;
      this.automationFlowUntil = performance.now() + CONFIG.FLOW_DURATION * 1000;
      this.player.setAutomationFlowActive(true);
      this.ui.setStatus(this._t("Automation Flow active"), CONFIG.STATUS_MESSAGE_MS);
    }
  }

  _flowMult() {
    const now = performance.now();
    const flow =
      now < this.automationFlowUntil ? CONFIG.FLOW_SCORE_MULT : 1;
    return flow;
  }

  _activateManualBoost() {
    const now = performance.now();
    if (now < this.manualBoostCooldownUntil) return;
    if (now < this.manualBoostUntil) return;
    this.manualBoostUntil = now + CONFIG.MANUAL_BOOST_DURATION * 1000;
    this.manualBoostCooldownUntil =
      this.manualBoostUntil + CONFIG.MANUAL_BOOST_COOLDOWN * 1000;
    play(SFX.BOOST_WHOOSH, 0.6);
    this.ui.setStatus(this._t("Manual boost!"), CONFIG.STATUS_MESSAGE_MS);
  }

  _manualBoostHud(now) {
    if (now < this.manualBoostUntil) {
      const total = CONFIG.MANUAL_BOOST_DURATION * 1000;
      const rem = this.manualBoostUntil - now;
      return { mbState: "active", mbProgress: rem / total };
    }
    if (now < this.manualBoostCooldownUntil) {
      const cdTotal = CONFIG.MANUAL_BOOST_COOLDOWN * 1000;
      const elapsed = now - this.manualBoostUntil;
      return { mbState: "cooldown", mbProgress: elapsed / cdTotal };
    }
    return { mbState: "ready", mbProgress: 1 };
  }

  _gameOver() {
    this._resetComboOverlay();
    this.state = "game_over";
    this.timeScale = 1;
    this.recoveryPrompt = false;
    this.braking = false;
    this.ui.showRecovery(false, false);
    this.player.setAutomationFlowActive(false);
    this.player.explode();
    stopLoop();
    play(SFX.GAME_OVER, 0.8);
    setBestScoreIfHigher(this.score);
    this.ui.setGameOverStats({
      score: this.score,
      hits: this.obstaclesHit,
      pickups: this.pickupsCollected,
      correct: this.sessionCorrect,
    });
    this.ui.resetGameOver(getLastName(), getLastCountry(), {
      hideNameEntry: this.currentLevel === "DS",
    });
    this.ui.showHud(false);
    this.ui.showGameOver(true);

    clearTimeout(this._gameOverTimer);
    this._gameOverTimer = setTimeout(() => {
      if (this.state === "game_over") {
        this.backToMenu();
      }
    }, 30000);
  }

  /** Combo timer only ticks in `_updateRun`; hide overlay whenever we leave active play. */
  _resetComboOverlay() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.ui.showCombo(0);
  }

  _levelComplete() {
    if (this.player) this.player._finishBreakawayEase = null;
    this._resetComboOverlay();
    this.state = "level_complete";
    this.timeScale = 1;
    this.recoveryPrompt = false;
    this.braking = false;
    this.ui.showRecovery(false, false);
    this.player.setAutomationFlowActive(false);
    stopLoop();
    play(SFX.CORRECT, 0.9);
    if (this.currentLevel !== "DS") {
      play(SFX.CROWD_CHEERS, 0.7);
    }
    if (this.player.carType === "timetrain") play(SFX.TRAIN_FINALE, 0.85);

    const finishBonus = 5000;
    this.score += finishBonus;
    setBestScoreIfHigher(this.score);

    this._orbitStartTime = performance.now();
    this._orbitCenter = this.player.mesh.position.clone();
    if (this.currentLevel === "DS") {
      this._lcOverlayDelayMs = 7200;
      this._spawnDeathStarFinale();
      this._revertFromDeathStarComplete = true;
    } else {
      this._lcOverlayDelayMs = 3000;
      this._spawnCelebration(this._orbitCenter);
    }

    const isCheater = this._isCheater();
    const cheaterType = this.currentLevel === "DS"
      ? "deathstar"
      : this.player.carType === "hippo"
        ? "hippo"
        : this.player.carType === "scaloneta"
          ? "scaloneta"
          : this.player.carType === "f16"
            ? "f16"
            : this.player.carType === "trex"
              ? "trex"
              : this.player.carType === "cadillac"
                ? "cadillac"
                : this.player.carType === "ogre"
                  ? "ogre"
                  : this.player.carType === "crooner"
                    ? "crooner"
                    : this.player.carType === "timetrain"
                      ? "timetrain"
                      : this.player.carType === "bicycle"
                        ? "bicycle"
                        : isCheater ? "semi" : null;
    this.ui.setLevelCompleteStats({
      score: this.score,
      hits: this.obstaclesHit,
      pickups: this.pickupsCollected,
      correct: this.sessionCorrect,
      finishBonus,
    }, isCheater, cheaterType);
    if (!isCheater) {
      this.ui.resetLevelComplete(getLastName(), getLastCountry());
    }
    this.ui.showHud(false);

    // Brief camera orbit before showing the overlay
    this._lcOverlayShown = false;
  }

  async saveLcScore() {
    if (this.currentLevel === "DS") {
      this.ui.setStatus(this._t("Trench run — leaderboards are not the Jedi way."), 4000);
      return;
    }
    if (this._isCheater()) {
      const msg = this.player.carType === "hippo"
        ? "Sorry, hippo mode can't be on the leaderboard. Stop cheating!"
        : this.player.carType === "scaloneta"
        ? "¡La Scaloneta no necesita leaderboard, campeón!"
        : this.player.carType === "f16"
        ? "Nice try, Maverick. Fighter jets don't qualify for the leaderboard."
        : this.player.carType === "trex"
        ? "T-Rex arms are too short to reach the leaderboard. Nice try though!"
        : this.player.carType === "cadillac"
        ? "Sorry darling, Hollywood stars don't do leaderboards. Too glamorous!"
        : this.player.carType === "ogre"
        ? "Ogres don't do leaderboards. Now get out of my swamp!"
        : this.player.carType === "crooner"
        ? "I gotta figure out how to make money on this — not leaderboards!"
        : this.player.carType === "timetrain"
        ? "Where we're going, we don't need leaderboards!"
        : this.player.carType === "bicycle"
        ? "Bicycles don't have leaderboards, eh? Go Leafs Go!"
        : "Nice try, but you can't set a high score as Andrius. Too easy!";
      this.ui.setStatus(msg, 4000);
      return;
    }
    const name = this.ui.getLcEnteredName() || "AAA";
    const country = this.ui.getLcSelectedCountry() || "US";
    setLastName(name);
    setLastCountry(country);
    const { rank, board } = addLeaderboardEntry(name, this.score, country, this.currentLevel);
    await submitGlobalScore(name, this.score, this.currentLevel, country);
    this.ui.showLcLeaderboard(board, rank, name, this.score);
  }

  async saveScore() {
    if (this.currentLevel === "DS") {
      this.ui.setStatus(this._t("Trench run — leaderboards are not the Jedi way."), 4000);
      return;
    }
    if (this._isCheater()) {
      const msg = this.player.carType === "hippo"
        ? "Sorry, hippo mode can't be on the leaderboard. Stop cheating!"
        : this.player.carType === "scaloneta"
        ? "¡La Scaloneta no necesita leaderboard, campeón!"
        : this.player.carType === "f16"
        ? "Nice try, Maverick. Fighter jets don't qualify for the leaderboard."
        : this.player.carType === "trex"
        ? "T-Rex arms are too short to reach the leaderboard. Nice try though!"
        : this.player.carType === "cadillac"
        ? "Sorry darling, Hollywood stars don't do leaderboards. Too glamorous!"
        : this.player.carType === "ogre"
        ? "Ogres don't do leaderboards. Now get out of my swamp!"
        : this.player.carType === "crooner"
        ? "I gotta figure out how to make money on this — not leaderboards!"
        : this.player.carType === "timetrain"
        ? "Where we're going, we don't need leaderboards!"
        : this.player.carType === "bicycle"
        ? "Bicycles don't have leaderboards, eh? Go Leafs Go!"
        : "Nice try, but you can't set a high score as Andrius. Too easy!";
      this.ui.setStatus(msg, 4000);
      return;
    }
    const name = this.ui.getEnteredName() || "AAA";
    const country = this.ui.getSelectedCountry() || "US";
    setLastName(name);
    setLastCountry(country);
    const { rank, board } = addLeaderboardEntry(name, this.score, country, this.currentLevel);
    await submitGlobalScore(name, this.score, this.currentLevel, country);
    this.ui.showLeaderboard(board, rank, name, this.score);
  }

  /** Recovery prompt */
  onRecoveryYes() {
    if (!this.recoveryPrompt) return;
    markRecoveryTipSeen();
    this.recoveryPrompt = false;
    this._resetQuizFlags();
    this.ui.showRecovery(false, false);
    this.currentQuestion = this.quiz.nextQuestion();
    this.quizMode = "recovery";
    this.state = "quiz";
    this._quizPhase = "question";
    this.ui.renderQuizQuestion(this.currentQuestion);
    this.ui.showQuiz(true);
    this.ui.startQuizCountdown(() => this.skipQuiz());
    this._startQuizSafetyTimer();
  }

  onRecoveryNo() {
    if (!this.recoveryPrompt) return;
    markRecoveryTipSeen();
    this.remediationsUsed += 1;
    this.recoveryPrompt = false;
    this.ui.showRecovery(false, false);
    this.timeScale = 1;
    const left = CONFIG.MAX_REMEDIATIONS - this.remediationsUsed;
    this.ui.setStatus(
      this._isScaloneta
        ? `¡Remediación saltada! (${left} restante${left !== 1 ? "s" : ""}). ¡Seguí manejando!`
        : `Skipped remediation (${left} remaining). Keep driving!`,
      CONFIG.STATUS_HIT_MS
    );
  }

  _openBoostQuiz() {
    this._resetQuizFlags();
    this.currentQuestion = this.quiz.nextQuestion();
    this.quizMode = "boost";
    this.state = "quiz";
    this._quizPhase = "question";
    this.ui.renderQuizQuestion(this.currentQuestion);
    this.ui.showQuiz(true);
    this.ui.setStatus(
      this._isScaloneta
        ? "Recolectado: Token de turbo — ruta pausada para prueba"
        : "Pickup: Boost token — highway paused for skill quiz",
      CONFIG.STATUS_HIT_MS
    );
    this.ui.startQuizCountdown(() => this.skipQuiz());
    this._startQuizSafetyTimer();
  }

  _openTutorialBoostQuiz() {
    this._resetQuizFlags();
    this.currentQuestion = { ...TUTORIAL_QUIZ_QUESTION };
    this.quizMode = "boost";
    this._tutorialQuizActive = true;
    this.state = "quiz";
    this._quizPhase = "question";
    this.ui.renderQuizQuestion(this.currentQuestion);
    this.ui.showQuiz(true);
    this.ui.showTutorialChecklist(false);
    this.ui.setStatus("Practice quiz — pick the right answer!", CONFIG.STATUS_HIT_MS);
    this.ui.startQuizCountdown(() => this.skipQuiz());
    this._startQuizSafetyTimer();
  }

  devSkipToFinish() {
    if (this.state !== "running") return;
    const dur = CONFIG.LEVEL_DURATION;
    this.runTime = Math.max(this.runTime, dur - 10);
    this.ui.setStatus("Dev: skipped to last 10 seconds", 2000);
  }

  skipQuiz() {
    if (this.state !== "quiz" || this._quizPhase !== "question") return;
    play(SFX.WRONG, 0.8);
    this.ui.stopQuizCountdown();
    this.ui.showQuiz(false);
    this.state = "running";
    this.quizMode = null;
    this.currentQuestion = null;
    this.timeScale = 1;
    this._resetQuizFlags();
    if (this._tutorialQuizActive) {
      this._tutorialQuizActive = false;
      this.ui.showTutorialChecklist(true);
      this._advanceTutorialStep();
      return;
    }
    this.ui.setStatus(
      this._isScaloneta
        ? "Prueba saltada — sin turbo, sin penalidad."
        : "Quiz skipped — no boost, no penalty.",
      CONFIG.STATUS_MESSAGE_MS
    );
  }

  _resetQuizFlags() {
    this._quizBusy = false;
    this._quizPhase = "question";
    clearTimeout(this._quizResultTimer);
    clearTimeout(this._quizSafetyTimer);
    this.ui.stopResultCountdown();
  }

  _startQuizSafetyTimer() {
    clearTimeout(this._quizSafetyTimer);
    this._quizSafetyTimer = setTimeout(() => {
      if (this.state === "quiz") {
        this.forceUnstick();
      }
    }, 30000);
  }

  update() {
    const now = performance.now();
    let dt = Math.min(0.05, (now - this._lastTs) / 1000);
    this._lastTs = now;

    if (this.state === "godzilla") {
      const done = this._godzillaMode.update(dt, now);
      this.ui.updateGodzillaHud(
        this._godzillaMode._bossPhase ? -1 : this._godzillaMode.timeLeft,
        this._godzillaMode.score,
        this._godzillaMode.crushed
      );
      if (done) this._exitGodzilla();
      return;
    }

    if (this.state === "boot") {
      this._updateCamera(dt, now);
      return;
    }

    if (this.state === "main_menu") {
      if (this._attractActive) {
        this._updateAttract(dt, now);
      }
      this._updateCamera(dt, now);
      return;
    }

    if (this.state === "paused" || this.state === "game_over") {
      this._updateCamera(dt, now);
      return;
    }

    if (this.state === "level_complete") {
      this._updateOrbitCamera(dt, now);
      this._updateCelebration(dt, now);
      if (!this._lcOverlayShown && now - this._orbitStartTime > this._lcOverlayDelayMs) {
        this._lcOverlayShown = true;
        this.ui.showLevelComplete(true);
      }
      const autoMenuMs = this.currentLevel === "DS" ? 26000 : 30000;
      if (now - this._orbitStartTime > autoMenuMs) {
        this.backToMenu();
      }
      return;
    }

    if (this.state === "billboard") {
      this._updateBillboardCamera(dt);
      return;
    }

    // Full pause during skill checks — no movement, spawns, collisions, or score clock
    if (this.state === "quiz") {
      this._updateCamera(0, now);
      this._refreshHudOnly(now);
      this._maybePlayDsAlmostThere();
      this._maybePlayDsUseTheForce();
      this._maybePlayDsR2d2();
      return;
    }

    const ts = (this.recoveryPrompt || this._tutorialPaused) ? 0 : 1;
    const effDt = dt * ts;

    if (this.state === "running") {
      this._tutorialUpdate(now);
      this._updateRun(effDt, now, dt, ts);
      this._updateDsProtonTorpedoes(effDt);
    }

    this._updateCamera(dt, now);
  }

  _refreshHudOnly(now) {
    const ramp = Math.min(
      CONFIG.MAX_SPEED_MULT,
      1 + this.runTime * CONFIG.SPEED_RAMP * 0.02
    );
    let speedMult = ramp * this.pickupSpeedMult;
    if (now < this.boostUntil) {
      speedMult *= CONFIG.BOOST_SPEED_MULT;
    }
    const driverMult = (DRIVERS[this.currentDriver] || {}).speedMult || 1;
    const ws = CONFIG.BASE_SPEED * speedMult * driverMult;
    const flowActive = now < this.automationFlowUntil;
    const { mbState, mbProgress } = this._manualBoostHud(now);
    this.player.setBraking(this.braking && this.state === "running");
    this.ui.updateHud({
      health: this.health,
      score: this.score,
      speed: ws,
      streak: this.streak,
      shield: this.shield,
      automationFlow: flowActive,
      boostRemaining: Math.max(0, this.boostUntil - now),
      boostTotal: this.boostUntil > this._boostStartedAt ? this.boostUntil - this._boostStartedAt : CONFIG.BOOST_DURATION * 1000,
      playbooks: this.playbookCount,
      playbookPts: this.playbookPts,
      collections: this.collectionCount,
      collectionPts: this.collectionPts,
      mbState,
      mbProgress,
      braking: this.braking,
      remediationsUsed: this.remediationsUsed,
      maxRemediations: CONFIG.MAX_REMEDIATIONS,
      finishProgress: this.runTime / CONFIG.LEVEL_DURATION,
      finishTimeLeft: CONFIG.LEVEL_DURATION - this.runTime,
      isScaloneta: this._isScaloneta,
    });
  }

  /** Death Star trench: one-shot “almost there” at 25% track time (also during quiz UI). */
  _maybePlayDsAlmostThere() {
    if (
      this.currentLevel !== "DS" ||
      this.tutorialMode ||
      this._dsAlmostTherePlayed ||
      this.runTime < CONFIG.LEVEL_DURATION * 0.25
    ) {
      return;
    }
    this._dsAlmostTherePlayed = true;
    play(SFX.DS_ALMOST_THERE, 0.88);
  }

  /** Death Star trench: one-shot at 50% track time (also during quiz UI). */
  _maybePlayDsUseTheForce() {
    if (
      this.currentLevel !== "DS" ||
      this.tutorialMode ||
      this._dsUseTheForcePlayed ||
      this.runTime < CONFIG.LEVEL_DURATION * 0.5
    ) {
      return;
    }
    this._dsUseTheForcePlayed = true;
    play(SFX.DS_USE_THE_FORCE, 0.88);
  }

  /** Death Star trench: one-shot at 75% track time (also during quiz UI). */
  _maybePlayDsR2d2() {
    if (
      this.currentLevel !== "DS" ||
      this.tutorialMode ||
      this._dsR2d2Played ||
      this.runTime < CONFIG.LEVEL_DURATION * 0.75
    ) {
      return;
    }
    this._dsR2d2Played = true;
    play(SFX.DS_R2D2, 0.88);
  }

  _updateRun(effDt, now, rawDt, spawnScale) {
    if (!this.tutorialMode) this.runTime += effDt;

    this._maybePlayDsAlmostThere();
    this._maybePlayDsUseTheForce();
    this._maybePlayDsR2d2();

    const dur = CONFIG.LEVEL_DURATION;
    const warnTime = dur - 10;
    if (this.runTime >= warnTime && !this._finishLineSpawned) {
      this._finishLineSpawned = true;
      const timeLeft = dur - this.runTime;
      this.track.spawnFinishLine(this.player.mesh.position.z, this.worldSpeed, timeLeft);
      if (this.currentLevel === "DS" && !this.tutorialMode) {
        const gen = this._dsFinishSfxGeneration;
        playWithOnEnded(SFX.DS_BLOW_THIS_THING, 0.88, () => {
          if (gen !== this._dsFinishSfxGeneration || this.state !== "running") return;
          play(SFX.DS_FINAL_SHOT, 0.9);
          this._spawnDsProtonTorpedoesToFinish();
        });
      }
      this.ui.setStatus(this._t("Checkered flag ahead — finish is near!"), 3000);
    }

    const finishZ = this.track.getFinishZ();
    if (!this._finishing && this._finishLineSpawned && finishZ !== null && finishZ >= this.player.mesh.position.z) {
      this._finishing = true;
      this._finishCoastSpeed = this.worldSpeed;
      this.spawner.reset();
      if (this.currentLevel === "DS") {
        this._dsFinishBreakawayT = 0;
      }
    }

    if (this._finishing) {
      if (this.currentLevel === "DS") {
        const coast = this._finishCoastSpeed;
        this.worldSpeed = coast;
        this.track.update(effDt, coast);
        this.spawner.update(rawDt, coast, this.runTime, 0);
        this._dsFinishBreakawayT += effDt;
        const breakDur = 2.75;
        const t = Math.min(1, this._dsFinishBreakawayT / breakDur);
        const ease = t * t * (3 - 2 * t);
        this.player._finishBreakawayEase = ease;
        this.player.update(effDt);
        this._updateCameraDsFinishBreakaway(effDt, now, ease);
        if (this._dsFinishBreakawayT >= breakDur) {
          this.player._finishBreakawayEase = null;
          this._levelComplete();
        }
        return;
      }
      this._finishCoastSpeed *= Math.pow(0.15, effDt);
      this.worldSpeed = this._finishCoastSpeed;
      this.track.update(effDt, this._finishCoastSpeed);
      this.spawner.update(rawDt, this._finishCoastSpeed, this.runTime, 0);
      this.player.update(effDt);
      this._updateCamera(effDt, now);
      if (this._finishCoastSpeed < 1.5) {
        this._levelComplete();
      }
      return;
    }

    this.track.update(effDt, this.worldSpeed);

    if (this.runTime >= dur + 15) {
      this._levelComplete();
      return;
    }

    const ramp = Math.min(
      CONFIG.MAX_SPEED_MULT,
      1 + this.runTime * CONFIG.SPEED_RAMP * 0.02
    );
    let speedMult = ramp;

    speedMult *= this.pickupSpeedMult;

    if (now < this.boostUntil) {
      speedMult *= CONFIG.BOOST_SPEED_MULT;
    }

    if (now < this.manualBoostUntil) {
      speedMult *= CONFIG.MANUAL_BOOST_MULT;
    }

    if (this.braking && this.state === "running") {
      speedMult *= CONFIG.BRAKE_SPEED_MULT;
    }

    this.player.updateTimeTravel(effDt);
    if (this.player.isTimeTraveling) {
      speedMult *= this.player.timeTravelSpeedMult;
    }

    const driverMult = (DRIVERS[this.currentDriver] || {}).speedMult || 1;
    const ws = CONFIG.BASE_SPEED * speedMult * driverMult;
    this.worldSpeed = ws;

    const flowActive = now < this.automationFlowUntil;
    this.player.setAutomationFlowActive(flowActive);

    const fm = flowActive ? CONFIG.FLOW_SCORE_MULT : 1;
    if (!this.tutorialMode) {
      this.score +=
        (CONFIG.SCORE_PER_SECOND * fm + CONFIG.SCORE_PER_UNIT_DISTANCE * ws * fm) *
        effDt;
    }

    // Strip curve offsets before game logic so collision uses straight positions
    this._stripCurve();

    if (flowActive) {
      this.spawner.applyMagnet(
        this.player.mesh.position.x,
        CONFIG.FLOW_MAGNET,
        effDt
      );
    }

    const scale = this.recoveryPrompt ? 0 : spawnScale;
    this.spawner.update(rawDt, ws, this.runTime, scale);

    this.player.update(effDt);
    this._updateXwingLaserBolts(effDt);
    this._updateBombs(effDt);
    this._updateTransformSmoke(effDt);

    // Combo timer countdown
    if (this.comboTimer > 0) {
      this.comboTimer -= effDt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboTimer = 0;
        this.ui.showCombo(0);
      }
    }

    const entities = this.spawner.getAllCollidable();
    const hits = this.collision.testEntities(entities);
    const obstacleHits = hits.filter((h) => h.entity.kind === "obstacle");
    const rivalHits = hits.filter((h) => h.entity.kind === "rival");
    const pickupHits = hits.filter((h) => h.entity.kind === "pickup");

    if (obstacleHits.length && !this.recoveryPrompt) {
      this._onHitObstacle(obstacleHits[0].entity);
    } else if (rivalHits.length && !this.recoveryPrompt) {
      this._onHitRival(rivalHits[0].entity);
    } else if (pickupHits.length && !this.recoveryPrompt) {
      this._onPickup(pickupHits[0].entity);
    }

    // Near-miss detection
    this._checkNearMisses(entities);

    // Achievement check (periodic, not every frame)
    this._achievementClock = (this._achievementClock || 0) + effDt;
    if (this._achievementClock > 1) {
      this._achievementClock = 0;
      this._checkAchievements();
    }

    // Speed tier FOV
    this._updateSpeedFov(ws);

    // Re-apply curve offsets for rendering
    this._applyCurve();

    const { mbState, mbProgress } = this._manualBoostHud(now);
    this.player.setBraking(this.braking && this.state === "running");
    this.ui.updateHud({
      health: this.health,
      score: this.score,
      speed: ws,
      streak: this.streak,
      shield: this.shield,
      automationFlow: flowActive,
      boostRemaining: Math.max(0, this.boostUntil - now),
      boostTotal: this.boostUntil > this._boostStartedAt ? this.boostUntil - this._boostStartedAt : CONFIG.BOOST_DURATION * 1000,
      playbooks: this.playbookCount,
      playbookPts: this.playbookPts,
      collections: this.collectionCount,
      collectionPts: this.collectionPts,
      mbState,
      mbProgress,
      braking: this.braking,
      comboCount: this.comboCount,
      comboTimer: this.comboTimer,
      remediationsUsed: this.remediationsUsed,
      maxRemediations: CONFIG.MAX_REMEDIATIONS,
      finishProgress: this.runTime / CONFIG.LEVEL_DURATION,
      finishTimeLeft: CONFIG.LEVEL_DURATION - this.runTime,
      isDelorean: this.player.carType === "delorean",
      ttCooldown: this.player.ttCooldownRemaining,
      ttCooldownMax: this.player.ttCooldownMax,
      ttActive: this.player.isTimeTraveling,
      isScaloneta: this._isScaloneta,
    });
  }

  get _isScaloneta() { return this.player.carType === "scaloneta"; }

  _t(text) { return this._isScaloneta && ES[text] ? ES[text] : text; }

  _isSemiTruck() {
    return this.player.carType === "semi_truck";
  }

  _isCheater() {
    return this.currentLevel === "DS" || this._isSemiTruck() || this.player.carType === "hippo" || this.player.carType === "scaloneta" || this.player.carType === "f16" || this.player.carType === "trex" || this.player.carType === "cadillac" || this.player.carType === "ogre" || this.player.carType === "crooner" || this.player.carType === "timetrain" || this.player.carType === "bicycle";
  }

  _croonerSmashLines = [
    "🎤 I GOTTA MAKE MONEY<br>ON THIS! 🎤",
    "🎤 IT'S SIMPLY<br>TOO GOOD! 🎤",
    "🎤 THEY'RE TRYING TO<br>MAKE IT LOOK FAKE! 🎤",
    "🎤 HE'S TRYING TO<br>STEAL MY DECALS! 🎤",
    "🎤 YOU'RE DRIVING WITH<br>THE DRIVING CROONER, BABY! 🎤",
    "🎤 THE HAT AND<br>THE CIGAR! 🎤",
    "🎤 FIVE CARS GOING<br>AROUND STATEWIDE! 🎤",
    "🎤 GOTTA BE RIGHT NEXT<br>TO ME FOR IT TO LOOK REAL! 🎤",
    "🎤 SLOPPY STEAKS<br>AT TRUFFONI'S! 🎤",
    "🎤 I USED TO BE<br>A PIECE OF WORK! 🎤",
  ];

  _timeTrainSmashLines = [
    "🚂 WHERE WE'RE GOING, WE<br>DON'T NEED ROADS! 🚂",
    "🚂 GREAT SCOTT!<br>88 MILES PER HOUR! 🚂",
    "🚂 YOUR FUTURE HASN'T<br>BEEN WRITTEN YET! 🚂",
    "🚂 1.21 GIGAWATTS<br>OF PAIN! 🚂",
    "🚂 THIS IS HEAVY! 🚂",
    "🚂 THE FLUX CAPACITOR<br>IS FLUXING! 🚂",
    "🚂 BACK TO<br>THE FUTURE! 🚂",
    "🚂 NOBODY CALLS ME<br>CHICKEN! 🚂",
    "🚂 SCIENCE! 🚂",
    "🚂 FULL STEAM<br>AHEAD, DOC! 🚂",
  ];

  _bicycleSmashLines = [
    "🚲 HICHAM DELIVERS<br>THE HIT! 🚲",
    "🚲 TWO WHEELS OF<br>DESTRUCTION! 🚲",
    "🚲 PELOTON<br>PILE-UP! 🚲",
    "🚲 BREAKAWAY<br>SMASH! 🚲",
    "🚲 TOUR DE FORCE! 🚲",
    "🚲 MAPLE POWERED<br>CRUSH! 🚲",
    "🚲 DROPPED FROM<br>THE PACK! 🚲",
    "🚲 GO LEAFS GO! 🚲",
    "🚲 SPRINT FINISH<br>KNOCKOUT! 🚲",
    "🚲 THE ARCHITECT<br>DESTROYS! 🚲",
  ];

  _ogreSfxPool = [SFX.OGRE_GRUNT_1, SFX.OGRE_GRUNT_2];
  _playOgreSfx(vol = 0.8) {
    const clip = this._ogreSfxPool[Math.floor(Math.random() * this._ogreSfxPool.length)];
    play(clip, vol);
  }

  _croonerSfxPool = [SFX.CROONER_1, SFX.CROONER_2, SFX.CROONER_3, SFX.CROONER_4, SFX.CROONER_5];
  /** Decode crooner VO clips early so the first smash is not stacked with obstacle-hit decode work. */
  _primeCroonerSfxBuffers() {
    preload(this._croonerSfxPool).catch(() => {});
  }
  _playCroonerSfx(vol = 0.8) {
    const clip = this._croonerSfxPool[Math.floor(Math.random() * this._croonerSfxPool.length)];
    play(clip, vol);
  }

  /**
   * Obstacle-hit branch: obstacle-hit.wav fires in parent (`showPopup`). Stagger VO + crush DOM so we
   * do not start two clips + innerHTML bursts on the same frame (first-hit jank).
   */
  _croonerSmashFeedback() {
    this.ui.showPickupPopup("+50,000");
    requestAnimationFrame(() => {
      const line = this._croonerSmashLines[Math.floor(Math.random() * this._croonerSmashLines.length)];
      this.ui.showHippoCrush(line);
    });
    setTimeout(() => this._playCroonerSfx(0.72), 115);
  }

  _ogreSmashLines = [
    "🧌 OGRE SMASH! 🧌",
    "🧌 GET OUT OF<br>MY SWAMP! 🧌",
    "🧌 CLUBBED! 🧌",
    "🧌 BETTER OUT<br>THAN IN! 🧌",
    "🧌 ONION<br>LAYERS! 🧌",
    "🧌 WHAT ARE YE<br>DOING IN MY LANE?! 🧌",
    "🧌 THIS IS<br>MY ROAD! 🧌",
    "🧌 OGRES ARE<br>LIKE ONIONS! 🧌",
    "🧌 FEE FI<br>FO FUM! 🧌",
    "🧌 DO THE<br>ROAR! 🧌",
  ];

  _hollywoodSmashLines = [
    "🌟 LIGHTS, CAMERA,<br>DESTRUCTION! 🌟",
    "🌟 AND THE OSCAR<br>GOES TO... 🌟",
    "🌟 THAT'S A WRAP! 🌟",
    "🌟 STUNT DOUBLE<br>NOT REQUIRED! 🌟",
    "🌟 BOX OFFICE<br>SMASH HIT! 🌟",
    "🌟 SCENE<br>STEALER! 🌟",
    "🌟 STARRING<br>AUBREY! 🌟",
    "🌟 RED CARPET<br>ROLLOVER! 🌟",
    "🌟 AAAND CUT! 🌟",
    "🌟 BLOCKBUSTER! 🌟",
  ];

  _trexSmashLines = [
    "🦖 ROOAARRR!! 🦖",
    "🦖 STOMPED! 🦖",
    "🦖 CHOMP! 🦖",
    "🦖 JURASSIC<br>JUSTICE! 🦖",
    "🦖 EXTINCT! 🦖",
    "🦖 CLEVER GIRL... 🦖",
    "🦖 LIFE FINDS<br>A WAY! 🦖",
    "🦖 MUST GO<br>FASTER! 🦖",
    "🦖 DINO<br>DAMAGE! 🦖",
    "🦖 CRETACEOUS<br>CRUNCH! 🦖",
  ];

  _transformSmoke = [];

  _spawnTransformSmoke() {
    const pos = this.player.mesh.position;
    const count = 60;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 1] = Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = Math.random() * 2 + 1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const smoke = new THREE.Points(geo, mat);
    smoke.position.copy(pos);
    this.scene.add(smoke);
    this._transformSmoke.push({ points: smoke, velocities, count, age: 0 });
  }

  _updateTransformSmoke(dt) {
    for (let i = this._transformSmoke.length - 1; i >= 0; i--) {
      const s = this._transformSmoke[i];
      s.age += dt;
      const p = s.points.geometry.attributes.position;
      for (let j = 0; j < s.count; j++) {
        p.array[j * 3] += s.velocities[j * 3] * dt;
        p.array[j * 3 + 1] += s.velocities[j * 3 + 1] * dt;
        p.array[j * 3 + 2] += s.velocities[j * 3 + 2] * dt;
      }
      p.needsUpdate = true;
      s.points.material.opacity = Math.max(0, 0.8 - s.age * 0.6);
      if (s.age > 1.5) {
        this.scene.remove(s.points);
        s.points.geometry.dispose();
        s.points.material.dispose();
        this._transformSmoke.splice(i, 1);
      }
    }
  }

  _cleanupTransformSmoke() {
    for (const s of this._transformSmoke) {
      this.scene.remove(s.points);
      s.points.geometry.dispose();
      s.points.material.dispose();
    }
    this._transformSmoke = [];
  }

  _f16BombLines = [
    "✈️ BOMBS AWAY! ✈️",
    "✈️ DANGER ZONE! ✈️",
    "✈️ FOX TWO! ✈️",
    "✈️ SPLASH ONE! ✈️",
    "✈️ TALLY HO! ✈️",
    "✈️ GOOD KILL! ✈️",
    "✈️ TARGET<br>DESTROYED! ✈️",
    "✈️ HIGHWAY TO<br>THE DANGER ZONE ✈️",
  ];

  _bombs = [];
  _explosions = [];
  _bombCooldown = 0;

  _dropBomb() {
    if (this._bombCooldown > 0) return;
    this._bombCooldown = 0.3;
    play(SFX.OBSTACLE_HIT, 0.7);
    const px = this.player.mesh.position.x;
    const pz = this.player.mesh.position.z;
    const py = this.player.mesh.position.y;

    if (!this._bombGeoCache) {
      this._bombGeoCache = new THREE.SphereGeometry(0.12, 4, 4);
      this._bombMatCache = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    }
    const bomb = new THREE.Mesh(this._bombGeoCache, this._bombMatCache);
    bomb.position.set(px, py - 0.3, pz);
    this.scene.add(bomb);

    this._bombs.push({ mesh: bomb, vy: -8, age: 0 });
  }

  _updateBombs(dt) {
    this._bombCooldown = Math.max(0, this._bombCooldown - dt);

    for (let i = this._bombs.length - 1; i >= 0; i--) {
      const b = this._bombs[i];
      b.age += dt;
      b.vy -= 20 * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z -= this.worldSpeed * dt * 0.5;

      if (b.mesh.position.y <= 0.1) {
        this._explodeBomb(b.mesh.position.clone());
        this.scene.remove(b.mesh);
        this._bombs.splice(i, 1);
      } else if (b.age > 5) {
        this.scene.remove(b.mesh);
        this._bombs.splice(i, 1);
      }
    }

    for (let i = this._explosions.length - 1; i >= 0; i--) {
      const ex = this._explosions[i];
      ex.age += dt;
      const p = ex.points.geometry.attributes.position;
      const v = ex.velocities;
      for (let j = 0; j < ex.count; j++) {
        p.array[j * 3] += v[j * 3] * dt;
        p.array[j * 3 + 1] += v[j * 3 + 1] * dt;
        v[j * 3 + 1] -= 9.8 * dt;
        p.array[j * 3 + 2] += v[j * 3 + 2] * dt;
      }
      p.needsUpdate = true;
      ex.points.material.opacity = Math.max(0, 1 - ex.age * 2.5);
      if (ex.age > 0.5) {
        this.scene.remove(ex.points);
        ex.points.geometry.dispose();
        ex.points.material.dispose();
        this._explosions.splice(i, 1);
      }
    }
  }

  _cleanupBombs() {
    for (const b of this._bombs) this.scene.remove(b.mesh);
    this._bombs = [];
    for (const ex of this._explosions) {
      this.scene.remove(ex.points);
      ex.points.geometry.dispose();
      ex.points.material.dispose();
    }
    this._explosions = [];
  }

  _explodeBomb(pos) {
    play(SFX.OBSTACLE_HIT, 0.9);
    this.ui.shake();
    this.shakeUntil = performance.now() + 200;
    this.shakeAmp = 0.3;

    const count = 20;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      velocities[i * 3] = (Math.random() - 0.5) * 5;
      velocities[i * 3 + 1] = Math.random() * 4 + 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.3,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    points.position.copy(pos);
    this.scene.add(points);
    this._explosions.push({ points, velocities, count, age: 0 });

    const blastRadius = 2.5;
    let hitSomething = false;
    for (let i = this.spawner.obstacles.length - 1; i >= 0; i--) {
      const o = this.spawner.obstacles[i];
      if (!o.active) continue;
      const dx = o.mesh.position.x - pos.x;
      const dz = o.mesh.position.z - pos.z;
      if (dx * dx + dz * dz < blastRadius * blastRadius) {
        this.spawner.explodeObstacle(o);
        this.score += 50000;
        hitSomething = true;
      }
    }
    for (let i = this.spawner.rivals.length - 1; i >= 0; i--) {
      const r = this.spawner.rivals[i];
      if (!r.active) continue;
      const dx = r.mesh.position.x - pos.x;
      const dz = r.mesh.position.z - pos.z;
      if (dx * dx + dz * dz < blastRadius * blastRadius) {
        this.spawner.explodeRival(r);
        this.score += 50000;
        hitSomething = true;
      }
    }
    if (hitSomething) {
      this.ui.showPickupPopup("+50,000");
      const line = this._f16BombLines[Math.floor(Math.random() * this._f16BombLines.length)];
      this.ui.showHippoCrush(line);
    }
  }

  _hippoSmashLines = [
    "🦛 NUNO WALL CRUSH 🦛",
    "🦛 HIPPO SMASH 🦛",
    "🦛 NUNO HIPPO CRUSH 🦛",
    "🦛 OBLITERATED 🦛",
    "🦛 HIPPO DON'T CARE 🦛",
    "🦛 NUNO DESTROYS ALL 🦛",
    "🦛 TOTAL CARNAGE 🦛",
    "🦛 HIPPO RAMPAGE 🦛",
    "🦛 UNSTOPPABLE 🦛",
    "🦛 NOTHING CAN<br>STOP THE HIPPO 🦛",
    "🦛 GET OUT THE WAY 🦛",
    "🦛 NUNO GOES BRRR 🦛",
    "🦛 FLATTENED 🦛",
    "🦛 HIPPO HUNGRY 🦛",
    "🦛 THAT WAS A WALL? 🦛",
    "🦛 NUNO SAYS NO 🦛",
  ];

  _scalonetaSmashLines = [
    "🇦🇷 ¡VAMOS CARAJO! 🇦🇷",
    "🇦🇷 ¡DALE CAMPEÓN! 🇦🇷",
    "🇦🇷 ¡QUÉ MIRÁS,<br>BOBO! 🇦🇷",
    "🇦🇷 ¡LA SCALONETA<br>NO FRENA! 🇦🇷",
    "🇦🇷 ¡MESSIRVE! 🇦🇷",
    "🇦🇷 ¡AGUANTE<br>ARGENTINA! 🇦🇷",
    "🇦🇷 ¡VAMOS MESSI! 🇦🇷",
    "🇦🇷 ¡SOMOS<br>CAMPEONES! 🇦🇷",
    "🇦🇷 ¡MUCHACHOS! 🇦🇷",
    "🇦🇷 ¡OLÉ OLÉ OLÉ! 🇦🇷",
    "🇦🇷 ¡TRES ESTRELLAS! 🇦🇷",
    "🇦🇷 ¡NO PASA NADA! 🇦🇷",
    "🇦🇷 ¡EL DIBU<br>DICE NO! 🇦🇷",
    "🇦🇷 ¡ARGENTINA<br>PAPÁ! 🇦🇷",
  ];

  _cheaterPopupAllowed() {
    const now = performance.now();
    /** Wider spacing: fewer simultaneous DOM/audio bursts + overlaps feel less laggy */
    if (now - this._lastCheaterPopupTs < 720) return false;
    this._lastCheaterPopupTs = now;
    return true;
  }

  _onHitObstacle(e) {
    if (this.tutorialMode) {
      this.spawner.explodeObstacle(e);
      this._tutorialEntityWasHit = true;
      if (this.shield) {
        this.shield = false;
        this.player.setShieldActive(false);
        play(SFX.SHIELD_HIT, 0.7);
        this.ui.setStatus("Shield blocked it! No damage taken.", 1800);
        this._advanceTutorialStep();
      } else {
        play(SFX.OBSTACLE_HIT, 0.9);
        this.ui.shake();
        this.shakeUntil = performance.now() + 200;
        this.ui.showDamagePopup(15);
        this._tutorialPaused = true;
        setTimeout(() => {
          this.ui.showTutorialTip(
            this.renderer.domElement.clientWidth / 2,
            this.renderer.domElement.clientHeight * 0.4,
            "Hitting obstacles costs health! Dodge them to survive."
          );
          this._tutorialHitPending = true;
        }, 600);
      }
      return;
    }
    if (this.player.carType === "f16") return;
    if (this.player.isAirborne) {
      this.spawner.explodeObstacle(e);
      this.ui.setStatus(this._isScaloneta ? "🛹 ¡Saltó por encima!" : "🛹 Jumped right over it!", 1200);
      play(SFX.OBSTACLE_HIT, 0.4);
      return;
    }
    if (this.player.isTimeTravelInvisible) {
      this.spawner.explodeObstacle(e);
      return;
    }
    /** DS stays “cheater” for leaderboards only — trench hits use normal damage below. */
    if (this._isCheater() && this.currentLevel !== "DS") {
      this.spawner.explodeObstacle(e);
      const showPopup = this._cheaterPopupAllowed();
      if (showPopup) {
        play(SFX.OBSTACLE_HIT, 0.6);
      }
      if (this.player.carType === "hippo") {
        this.score += 50000;
        if (showPopup) {
          const blahs = [SFX.HIPPO_BLAH_1, SFX.HIPPO_BLAH_2, SFX.HIPPO_BLAH_3, SFX.HIPPO_BLAH_4];
          play(blahs[Math.floor(Math.random() * blahs.length)], 0.85);
          this.ui.showPickupPopup("+50,000");
          const line = this._hippoSmashLines[Math.floor(Math.random() * this._hippoSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "scaloneta") {
        this.score += 50000;
        if (showPopup) {
          play(SFX.SCALONETA, 0.6);
          this.ui.showPickupPopup("+50.000");
          const line = this._scalonetaSmashLines[Math.floor(Math.random() * this._scalonetaSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "trex") {
        this.score += 50000;
        if (showPopup) {
          play(SFX.OBSTACLE_HIT, 0.7);
          this.ui.showPickupPopup("+50,000");
          const line = this._trexSmashLines[Math.floor(Math.random() * this._trexSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "cadillac") {
        this.score += 50000;
        if (showPopup) {
          play(SFX.OBSTACLE_HIT, 0.6);
          this.ui.showPickupPopup("+50,000");
          const line = this._hollywoodSmashLines[Math.floor(Math.random() * this._hollywoodSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "ogre") {
        this.score += 50000;
        if (showPopup) {
          this._playOgreSfx(0.8);
          this.ui.showPickupPopup("+50,000");
          const line = this._ogreSmashLines[Math.floor(Math.random() * this._ogreSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "crooner") {
        this.score += 50000;
        if (showPopup) {
          this._croonerSmashFeedback();
        }
      } else if (this.player.carType === "timetrain") {
        this.score += 50000;
        this._trainHitCount = (this._trainHitCount || 0) + 1;
        if (showPopup) {
          const trainSfx = this._trainHitCount === 1 ? SFX.TRAIN_35MPH
            : this._trainHitCount === 2 ? SFX.TRAIN_45MPH
            : [SFX.TRAIN_WHISTLE, SFX.TRAIN_WHISTLE_ALT, SFX.TRAIN_EXPLOSION][Math.floor(Math.random() * 3)];
          play(trainSfx, 0.7);
          this.ui.showPickupPopup("+50,000");
          const line = this._timeTrainSmashLines[Math.floor(Math.random() * this._timeTrainSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "bicycle") {
        this.score += 50000;
        if (showPopup) {
          play(SFX.OBSTACLE_HIT, 0.7);
          this.ui.showPickupPopup("+50,000");
          const line = this._bicycleSmashLines[Math.floor(Math.random() * this._bicycleSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else {
        if (showPopup) this.ui.setStatus(this._t("Smashed right through it!"), 1200);
      }
      return;
    }
    const isGator = e.subtype === "GATOR";
    if (this.shield) {
      this.spawner.explodeObstacle(e);
      this.shield = false;
      this.player.setShieldActive(false);
      play(SFX.SHIELD_HIT, 0.7);
      this.ui.setStatus(
        this._isScaloneta
          ? (isGator ? "¡Cocodrilo aplastado — escudo lo bloqueó!" : "¡Obstáculo — escudo lo bloqueó! (Escudo gastado)")
          : (isGator ? "Gator smashed -- shield blocked it!" : "Obstacle hit -- shield blocked it! (Shield used up)"),
        CONFIG.STATUS_HIT_MS
      );
      return;
    }
    this.spawner.explodeObstacle(e);

    const dmg = CONFIG.OBSTACLE_DAMAGE;
    this.health -= dmg;
    this.obstaclesHit += 1;
    play(SFX.OBSTACLE_HIT, 0.8);
    this.ui.flashDamage();
    this.ui.showDamagePopup(dmg);
    this.ui.shake();
    this.shakeUntil = performance.now() + (isGator ? 300 : 200);
    this.shakeAmp = isGator ? 0.45 : 0.35;
    const hp = Math.max(0, Math.floor(this.health));
    this.ui.setStatus(
      this._isScaloneta
        ? (isGator ? `¡Ataque de cocodrilo! -${dmg} salud. Estás en ${hp}.` : `¡Obstáculo! -${dmg} salud (Corte). Estás en ${hp}.`)
        : (isGator ? `Gator attack! -${dmg} health. You're at ${hp}.` : `Obstacle hit! -${dmg} health (Outage). You're at ${hp}.`),
      CONFIG.STATUS_HIT_MS
    );

    if (this.health <= 0) {
      this._gameOver();
      return;
    }

    if (
      this.quizEnabled &&
      (!this._isCheater() || this.currentLevel === "DS") &&
      this.remediationsUsed < CONFIG.MAX_REMEDIATIONS
    ) {
      this.recoveryPrompt = true;
      const showTip = !hasSeenRecoveryTip();
      this.ui.showRecovery(true, showTip, () => {
        play(SFX.WRONG, 0.8);
        this.onRecoveryNo();
      });
    }
  }

  _onHitRival(e) {
    if (this.player.carType === "f16") return;
    if (this.player.isAirborne) {
      this.spawner.explodeRival(e);
      this.ui.setStatus(this._isScaloneta ? "🛹 ¡Pasó por arriba!" : "🛹 Skated over them!", 1200);
      play(SFX.OBSTACLE_HIT, 0.4);
      return;
    }
    if (this.player.isTimeTravelInvisible) {
      this.spawner.explodeRival(e);
      return;
    }
    if (this._isCheater() && this.currentLevel !== "DS") {
      this.spawner.explodeRival(e);
      const showPopup = this._cheaterPopupAllowed();
      if (showPopup) {
        play(SFX.OBSTACLE_HIT, 0.6);
      }
      if (this.player.carType === "hippo") {
        this.score += 50000;
        if (showPopup) {
          const blahs = [SFX.HIPPO_BLAH_1, SFX.HIPPO_BLAH_2, SFX.HIPPO_BLAH_3, SFX.HIPPO_BLAH_4];
          play(blahs[Math.floor(Math.random() * blahs.length)], 0.85);
          this.ui.showPickupPopup("+50,000");
          const line = this._hippoSmashLines[Math.floor(Math.random() * this._hippoSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "scaloneta") {
        this.score += 50000;
        if (showPopup) {
          play(SFX.SCALONETA, 0.6);
          this.ui.showPickupPopup("+50.000");
          const line = this._scalonetaSmashLines[Math.floor(Math.random() * this._scalonetaSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "trex") {
        this.score += 50000;
        if (showPopup) {
          play(SFX.OBSTACLE_HIT, 0.7);
          this.ui.showPickupPopup("+50,000");
          const line = this._trexSmashLines[Math.floor(Math.random() * this._trexSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "cadillac") {
        this.score += 50000;
        if (showPopup) {
          play(SFX.OBSTACLE_HIT, 0.6);
          this.ui.showPickupPopup("+50,000");
          const line = this._hollywoodSmashLines[Math.floor(Math.random() * this._hollywoodSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "ogre") {
        this.score += 50000;
        if (showPopup) {
          this._playOgreSfx(0.8);
          this.ui.showPickupPopup("+50,000");
          const line = this._ogreSmashLines[Math.floor(Math.random() * this._ogreSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "crooner") {
        this.score += 50000;
        if (showPopup) {
          this._croonerSmashFeedback();
        }
      } else if (this.player.carType === "timetrain") {
        this.score += 50000;
        this._trainHitCount = (this._trainHitCount || 0) + 1;
        if (showPopup) {
          const trainSfx = this._trainHitCount === 1 ? SFX.TRAIN_35MPH
            : this._trainHitCount === 2 ? SFX.TRAIN_45MPH
            : [SFX.TRAIN_WHISTLE, SFX.TRAIN_WHISTLE_ALT, SFX.TRAIN_EXPLOSION][Math.floor(Math.random() * 3)];
          play(trainSfx, 0.7);
          this.ui.showPickupPopup("+50,000");
          const line = this._timeTrainSmashLines[Math.floor(Math.random() * this._timeTrainSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else if (this.player.carType === "bicycle") {
        this.score += 50000;
        if (showPopup) {
          play(SFX.OBSTACLE_HIT, 0.7);
          this.ui.showPickupPopup("+50,000");
          const line = this._bicycleSmashLines[Math.floor(Math.random() * this._bicycleSmashLines.length)];
          this.ui.showHippoCrush(line);
        }
      } else {
        if (showPopup) this.ui.setStatus(this._t("Plowed right through!"), 1200);
      }
      return;
    }
    const isBus = e.subtype === "SCHOOL_BUS";
    this.spawner.explodeRival(e);
    if (this.shield) {
      this.shield = false;
      this.player.setShieldActive(false);
      play(SFX.SHIELD_HIT, 0.7);
      this.ui.setStatus(
        this._isScaloneta
          ? (isBus ? "¡Choque de colectivo — escudo absorbió el golpe!" : "¡Auto rival — escudo absorbió el golpe!")
          : (isBus ? "School bus hit — shield absorbed the crash!" : "Rival car hit — shield absorbed the crash!"),
        CONFIG.STATUS_HIT_MS
      );
      return;
    }

    const dmg = isBus ? CONFIG.BUS_DAMAGE : CONFIG.OBSTACLE_DAMAGE;
    this.health -= dmg;
    this.obstaclesHit += 1;
    play(SFX.OBSTACLE_HIT, 0.8);
    this.ui.flashDamage();
    this.ui.showDamagePopup(dmg);
    this.ui.shake();
    this.shakeUntil = performance.now() + (isBus ? 350 : 200);
    this.shakeAmp = isBus ? 0.5 : 0.35;
    const rhp = Math.max(0, Math.floor(this.health));
    this.ui.setStatus(
      this._isScaloneta
        ? (isBus ? `¡Choque de colectivo! −${dmg} salud. Estás en ${rhp}.` : `¡Choque rival! −${dmg} salud. Estás en ${rhp}.`)
        : (isBus ? `School bus crash! −${dmg} health. You're at ${rhp}.` : `Rival car crash! −${dmg} health. You're at ${rhp}.`),
      CONFIG.STATUS_HIT_MS
    );

    if (this.health <= 0) {
      this._gameOver();
      return;
    }

    if (
      this.quizEnabled &&
      (!this._isCheater() || this.currentLevel === "DS") &&
      this.remediationsUsed < CONFIG.MAX_REMEDIATIONS
    ) {
      this.recoveryPrompt = true;
      const showTip = !hasSeenRecoveryTip();
      this.ui.showRecovery(true, showTip, () => {
        play(SFX.WRONG, 0.8);
        this.onRecoveryNo();
      });
    }
  }

  _onPickup(e) {
    const t = e.subtype;

    if (this.tutorialMode) {
      this.spawner.removeEntity(e);
      this._tutorialPickupCollected = true;
      if (t === "POLICY_SHIELD") {
        this.shield = true;
        this.player.setShieldActive(true);
        play(SFX.SHIELD_ON, 0.75);
        this.ui.showPickupPopup("Shield activated!");
      } else if (t === "BOOST_TOKEN") {
        play(SFX.PICKUP, 0.6);
        this.ui.showPickupPopup("Boost Token!");
        this._openTutorialBoostQuiz();
        return;
      } else if (t === "PLAYBOOK") {
        play(SFX.PICKUP, 0.6);
        this.ui.showPickupPopup("Playbook +100");
      } else if (t === "CERTIFIED_COLLECTION") {
        play(SFX.PICKUP, 0.6);
        this.ui.showPickupPopup("Collection +150");
      } else {
        play(SFX.PICKUP, 0.6);
      }
      this._advanceTutorialStep();
      return;
    }

    this.spawner.removeEntity(e);
    this.pickupsCollected += 1;

    if (t !== "POLICY_SHIELD") play(SFX.PICKUP, 0.6);

    // Combo multiplier
    const isScoring = t === "PLAYBOOK" || t === "CERTIFIED_COLLECTION";
    let comboMult = 1;
    if (isScoring) {
      if (this.comboTimer > 0) {
        this.comboCount += 1;
      } else {
        this.comboCount = 1;
      }
      this.comboTimer = CONFIG.COMBO_WINDOW;
      comboMult = this.comboCount;
      if (this.comboCount > this._runMaxCombo) this._runMaxCombo = this.comboCount;
      if (this.comboCount >= 2) {
        this.ui.showCombo(this.comboCount);
      }
    }

    if (t === "PLAYBOOK") {
      const base = Math.floor(CONFIG.PICKUP_SCORE.PLAYBOOK * this._flowMult());
      const pts = base * comboMult;
      this.score += pts;
      this.playbookCount += 1;
      this.playbookPts += pts;
      const extended = this._extendBoostOnPickup();
      let label = comboMult > 1 ? `Playbook +${pts} (x${comboMult})` : `Playbook +${pts}`;
      if (extended) label += this._isScaloneta ? " ⚡+turbo" : " ⚡+boost";
      this.ui.showPickupPopup(label);
      if (this.playbookCount % 3 === 0) {
        this._applyPickupSpeedUp("Playbook", this.playbookCount);
      } else {
        this.ui.setStatus(
          this._isScaloneta ? `Recolectado: Playbook — +${pts} puntos` : `Pickup: Playbook — +${pts} score`,
          CONFIG.STATUS_HIT_MS
        );
      }
    } else if (t === "CERTIFIED_COLLECTION") {
      const base = Math.floor(CONFIG.PICKUP_SCORE.COLLECTION * this._flowMult());
      const pts = base * comboMult;
      this.score += pts;
      this.collectionCount += 1;
      this.collectionPts += pts;
      const extended = this._extendBoostOnPickup();
      const cLabel = this._isScaloneta ? "Colección" : "Collection";
      let label = comboMult > 1 ? `${cLabel} +${pts} (x${comboMult})` : `${cLabel} +${pts}`;
      if (extended) label += this._isScaloneta ? " ⚡+turbo" : " ⚡+boost";
      this.ui.showPickupPopup(label);
      if (this.collectionCount % 3 === 0) {
        this._applyPickupSpeedUp(this._isScaloneta ? "Colección" : "Collection", this.collectionCount);
      } else {
        this.ui.setStatus(
          this._isScaloneta ? `Recolectado: Colección certificada — +${pts} puntos` : `Pickup: Certified Collection — +${pts} score`,
          CONFIG.STATUS_HIT_MS
        );
      }
    } else if (t === "POLICY_SHIELD") {
      /** DS is “cheater” for leaderboards only — still use a real shield + SFX in the trench. */
      const jokeShieldCheater = this._isCheater() && this.currentLevel !== "DS";
      if (jokeShieldCheater) {
        this.score += 50;
        this.ui.showPickupPopup("+50");
        const msg = this.player.carType === "hippo"
          ? "Shield? The hippo IS the shield. +50 score"
          : this._isScaloneta
            ? "¿Escudo? ¡La Scaloneta ES el escudo! +50 puntos"
            : "Shield? You ARE the shield. +50 score";
        this.ui.setStatus(msg, CONFIG.STATUS_HIT_MS);
      } else {
        this.shield = true;
        this.player.setShieldActive(true);
        play(SFX.SHIELD_ON, 0.75);
        this.ui.showPickupPopup(this._isScaloneta ? "¡Escudo activo!" : "Shield Active!");
        this.ui.setStatus(
          this._isScaloneta
            ? "Recolectado: Escudo — el próximo obstáculo no te quita salud"
            : "Pickup: Policy Shield — next obstacle hit won’t cost health",
          CONFIG.STATUS_HIT_MS
        );
      }
    } else if (t === "BOOST_TOKEN") {
      if (this._isCheater() && this.currentLevel !== "DS") {
        const now = performance.now();
        const stacking = now < this.boostUntil;
        const base = stacking ? this.boostUntil : now;
        if (!stacking) this._boostStartedAt = now;
        this.boostUntil = base + CONFIG.BOOST_DURATION * 1500;
        this._runBoostCount += 1;
        play(SFX.BOOST_WHOOSH, 0.85);
        this.score += 50000;
        this.ui.showPickupPopup("+50,000");
      } else if (performance.now() < this.boostUntil) {
        this.boostUntil += CONFIG.BOOST_EXTEND_ON_PICKUP * 1000;
        play(SFX.BOOST_WHOOSH, 0.6);
        this.ui.showPickupPopup(this._t("Boost Extended!"));
        this.ui.setStatus(this._isScaloneta ? "¡Turbo extendido!" : "Boost extended!", CONFIG.STATUS_MESSAGE_MS);
      } else if (this.quizEnabled) {
        this._openBoostQuiz();
      } else {
        const now = performance.now();
        const stacking = now < this.boostUntil;
        const base = stacking ? this.boostUntil : now;
        if (!stacking) this._boostStartedAt = now;
        this.boostUntil = base + CONFIG.BOOST_DURATION * 1000;
        this._runBoostCount += 1;
        play(SFX.BOOST_WHOOSH, 0.85);
        this.ui.showPickupPopup(stacking ? this._t("Boost Extended!") : this._t("Speed Boost!"));
        this.ui.setStatus(this._isScaloneta ? "Token de turbo: ¡Velocidad!" : "Boost token: Speed Boost!", CONFIG.STATUS_MESSAGE_MS);
      }
    }
  }

  _extendBoostOnPickup() {
    const now = performance.now();
    if (now >= this.boostUntil) return false;
    this.boostUntil += CONFIG.BOOST_EXTEND_ON_PICKUP * 1000;
    return true;
  }

  _applyPickupSpeedUp(type, count) {
    this.pickupSpeedMult = Math.min(this.pickupSpeedMult + 0.15, CONFIG.MAX_PICKUP_SPEED_MULT);
    const pct = Math.round((this.pickupSpeedMult - 1) * 100);
    this.ui.setStatus(
      this._isScaloneta
        ? `${count} ${type}s recolectados! Velocidad +15% (total +${pct}%)`
        : `${count} ${type}s collected! Speed +15% (total +${pct}%)`,
      CONFIG.STATUS_HIT_MS
    );
  }

  // Near-miss detection
  _nearMissCount = 0;

  _checkNearMisses(entities) {
    const px = this.player.mesh.position.x;
    const pz = this.player.mesh.position.z;
    const margin = CONFIG.NEAR_MISS_MARGIN;

    for (const e of entities) {
      if (e.kind !== "obstacle" && e.kind !== "rival") continue;
      if (!e.active) continue;
      const eid = e.mesh.uuid;
      if (this._nearMissChecked.has(eid)) continue;

      const ez = e.mesh.position.z;
      // Entity just passed the player (moved behind)
      if (ez > pz + 1 && ez < pz + 4) {
        const dx = Math.abs(e.mesh.position.x - px);
        if (dx < margin + 1.2 && dx > 0.3) {
          this._nearMissChecked.add(eid);
          this._nearMissCount += 1;
          this.score += CONFIG.NEAR_MISS_BONUS;
          this.ui.showPickupPopup(this._isScaloneta ? `¡POR POCO! +${CONFIG.NEAR_MISS_BONUS}` : `CLOSE CALL! +${CONFIG.NEAR_MISS_BONUS}`);
          this._checkAchievements();
        } else {
          // Mark as checked once past to avoid repeat checks
          if (ez > pz + 3) this._nearMissChecked.add(eid);
        }
      }
    }
  }

  // Achievement checking
  _checkAchievements() {
    const checks = [
      { id: "score_10k", test: () => this.score >= 10000 },
      { id: "score_50k", test: () => this.score >= 50000 },
      { id: "combo_5", test: () => this._runMaxCombo >= 5 },
      { id: "combo_10", test: () => this._runMaxCombo >= 10 },
      { id: "streak_5", test: () => this.streak >= 5 },
      { id: "boost_5", test: () => this._runBoostCount >= 5 },
      { id: "playbooks_20", test: () => this.playbookCount >= 20 },
      { id: "collections_15", test: () => this.collectionCount >= 15 },
      { id: "survive_60", test: () => this.runTime >= 60 },
      { id: "survive_120", test: () => this.runTime >= 120 },
      { id: "near_miss_10", test: () => this._nearMissCount >= 10 },
      { id: "no_damage", test: () => this.score >= 5000 && this.obstaclesHit === 0 },
    ];
    for (const c of checks) {
      if (this._achievements[c.id]) continue;
      if (c.test()) {
        const unlocked = unlockAchievement(c.id);
        if (unlocked) {
          this._achievements[c.id] = Date.now();
          const def = ACHIEVEMENT_DEFS.find((d) => d.id === c.id);
          if (def) this.ui.showAchievement(def.name, def.desc);
        }
      }
    }
  }

  // Speed tier FOV
  _updateSpeedFov(ws) {
    const ratio = ws / CONFIG.BASE_SPEED;
    const targetFov = this._baseFov + Math.min(12, (ratio - 1) * 10);
    this.camera.fov += (targetFov - this.camera.fov) * 0.05;
    this.camera.updateProjectionMatrix();
  }

  _updateBillboardCamera(dt) {
    const lerpSpeed = dt * 2.0;
    this.camera.position.lerp(this._bbTargetPos, lerpSpeed);
    this._bbCurrentLook.lerp(this._bbTargetLook, lerpSpeed);
    this.camera.lookAt(this._bbCurrentLook);

    const dist = this.camera.position.distanceTo(this._bbTargetPos);

    if (!this._bbReturning && !this._bbOverlayShown && dist < 3) {
      this._bbOverlayShown = true;
      const def = this._bbDef || {};
      const alreadyClaimed = this._demoCompleted.has(this._activeBillboard);
      this.ui.showBillboard(true, {
        label: this._bbLabel,
        embed: def.embed || null,
        embedTitle: def.embedTitle || "",
        logo: def.logo || null,
        showBonus: !alreadyClaimed,
      });
    }

    if (this._bbReturning && dist < 1.5) {
      this._activeBillboard = null;
      this._bbZooming = false;
      this._bbReturning = false;
      this.state = this._bbReturnState;
      this.renderer.domElement.style.cursor = "";
    }
  }

  _stripCurve() {
    if (!this.track._curve) return;
    const p = this.player;
    p.mesh.position.x -= p._curveX || 0;
    p._curveX = 0;
    for (const e of this.spawner.getAllCollidable()) {
      e.mesh.position.x -= e._curveX || 0;
      e._curveX = 0;
    }
  }

  _applyCurve() {
    if (!this.track._curve) return;
    const p = this.player;
    const pcx = this.track.getCurveX(p.mesh.position.z);
    p._curveX = pcx;
    p.mesh.position.x += pcx;

    for (const e of this.spawner.getAllCollidable()) {
      const ecx = this.track.getCurveX(e.mesh.position.z);
      e._curveX = ecx;
      e.mesh.position.x += ecx;
    }
  }

  // ── Attract mode (demo play behind main menu) ──

  _startAttractMode() {
    this._attractActive = true;
    this._attractDodgeTimer = 0;
    this._attractSpawnElapsed = 0;
    this.spawner.levelId = this.currentLevel;
    this.spawner.reset();
    this.spawner.attractMode = true;
    this.player.mesh.visible = true;
    this.player.targetLaneIndex = 1;
    this.player.laneIndex = 1;
    this.player.mesh.position.set(CONFIG.LANES[1], CONFIG.PLAYER_Y, 0);
    this.player._curveX = 0;
    this._attractSpeed = CONFIG.BASE_SPEED * 0.85;

    this._attractScoreShowing = false;
    this.ui.showAttractScores(false);
    clearInterval(this._attractScoreFlashTimer);
    this._attractScoreFlashTimer = setInterval(() => {
      if (!this._attractActive || this.state !== "main_menu") return;
      if (this.ui.isDriverSelectVisible()) return;
      this._attractScoreShowing = true;
      this.ui.showAttractScores(true);
      setTimeout(() => {
        this._attractScoreShowing = false;
        this.ui.showAttractScores(false);
      }, 10000);
    }, 30000);

    this._applyDeathStarRunVehicle();
  }

  _stopAttractMode() {
    this._attractActive = false;
    this._attractSpawnElapsed = 0;
    this.spawner.reset();
    this.ui.showAttractScores(false);
    clearInterval(this._attractScoreFlashTimer);
    this._attractScoreFlashTimer = null;
  }

  /** When attract leaderboard overlay hides (Escape, click-away, timer). Keeps `_attractScoreShowing` aligned. */
  notifyAttractScoresDismissed() {
    this._attractScoreShowing = false;
  }

  _updateAttract(dt, now) {
    this._stripCurve();

    this.track.update(dt, this._attractSpeed);
    this._attractSpawnElapsed += dt;
    /** Hardcoded `15` made `elapsed >= WARMUP` so attract skipped warmup and spammed spawns like late run. */
    const attractElapsed = Math.min(
      this._attractSpawnElapsed,
      CONFIG.WARMUP_SECONDS * 0.85
    );
    this.spawner.update(dt, this._attractSpeed, attractElapsed, 1);

    // AI dodge logic — look ahead for obstacles and switch lanes
    this._attractDodgeTimer -= dt;
    if (this._attractDodgeTimer <= 0) {
      this._attractDodgeTimer = 0.25;
      const lane = this.player.targetLaneIndex;
      const blocked = [false, false, false];
      for (const o of this.spawner.obstacles) {
        if (!o.active) continue;
        const dz = o.mesh.position.z - this.player.mesh.position.z;
        if (dz > -35 && dz < -5) {
          blocked[o.lane] = true;
        }
      }
      for (const r of this.spawner.rivals) {
        if (!r.active) continue;
        const dz = r.mesh.position.z - this.player.mesh.position.z;
        if (dz > -25 && dz < -3) {
          blocked[r.targetLane] = true;
        }
      }
      if (blocked[lane]) {
        const adj = [0, 1, 2].filter((l) => !blocked[l] && Math.abs(l - lane) === 1);
        const any = [0, 1, 2].filter((l) => !blocked[l]);
        const pick = adj.length > 0 ? adj : any;
        if (pick.length > 0) {
          this.player.targetLaneIndex = pick[Math.floor(Math.random() * pick.length)];
        }
      } else if (Math.random() < 0.03) {
        // Occasional random lane change for visual interest
        const dir = Math.random() < 0.5 ? -1 : 1;
        const nl = lane + dir;
        if (nl >= 0 && nl <= 2) this.player.targetLaneIndex = nl;
      }
    }

    this.player.update(dt);

    const px = this.player.mesh.position.x;
    const pz = this.player.mesh.position.z;
    for (const list of [this.spawner.obstacles, this.spawner.pickups, this.spawner.rivals]) {
      for (let i = list.length - 1; i >= 0; i--) {
        const e = list[i];
        if (!e.active) continue;
        if (e.mesh.position.z > CONFIG.DESPAWN_Z) {
          this.spawner.removeEntity(e);
          continue;
        }
        const dz = Math.abs(e.mesh.position.z - pz);
        const dx = Math.abs(e.mesh.position.x - px);
        if (dz < 1.8 && dx < 1.5) {
          this.spawner.removeEntity(e);
        }
      }
    }

    this._applyCurve();
  }

  /** Low-poly X-wing (engines toward +Z) for the escape finale; nose is −Z. */
  _buildFinaleMiniXWing() {
    const g = new THREE.Group();
    const hull = new THREE.MeshStandardMaterial({
      color: 0xc0c8d4, metalness: 0.5, roughness: 0.4, flatShading: true,
    });
    const red = new THREE.MeshStandardMaterial({
      color: 0xb82222, metalness: 0.4, roughness: 0.45, flatShading: true,
    });
    const bodyC = new THREE.Vector3(0, 0.26, 0);
    const wingLen = 0.82;
    const wingT = 0.034;
    const wingW = 0.25;
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.72), hull);
    fuselage.position.copy(bodyC);
    g.add(fuselage);
    const dirs = [
      new THREE.Vector3(-0.68, 0.21, -0.06),
      new THREE.Vector3(0.68, 0.21, -0.06),
      new THREE.Vector3(-0.68, -0.19, -0.06),
      new THREE.Vector3(0.68, -0.19, -0.06),
    ];
    const finSfoilBasis = new THREE.Matrix4();
    const _finSx = new THREE.Vector3();
    const _finSy = new THREE.Vector3();
    const _finSz = new THREE.Vector3();
    const _finFwd = new THREE.Vector3(0, 0, -1);
    const _finUp = new THREE.Vector3(0, 1, 0);
    const _finFb = new THREE.Vector3(0, 0, 1);
    const setFinaleSfoilWing = (mesh, spanRaw) => {
      _finSx.copy(spanRaw).normalize();
      _finSy.crossVectors(_finSx, _finFwd);
      if (_finSy.lengthSq() < 1e-10) {
        _finSy.crossVectors(_finSx, _finUp);
        if (_finSy.lengthSq() < 1e-10) _finSy.crossVectors(_finSx, _finFb);
      }
      _finSy.normalize();
      _finSz.crossVectors(_finSx, _finSy).normalize();
      finSfoilBasis.makeBasis(_finSx, _finSy, _finSz);
      mesh.quaternion.setFromRotationMatrix(finSfoilBasis);
    };
    for (const raw of dirs) {
      const d = raw.clone().normalize();
      const w = new THREE.Mesh(new THREE.BoxGeometry(wingLen, wingT, wingW), hull);
      setFinaleSfoilWing(w, raw);
      w.position.copy(bodyC).add(d.clone().multiplyScalar(0.18 + wingLen * 0.5));
      g.add(w);
      const st = new THREE.Mesh(new THREE.BoxGeometry(wingLen * 0.18, wingT + 0.008, 0.07), red);
      st.quaternion.copy(w.quaternion);
      st.position.copy(w.position).add(d.clone().multiplyScalar(wingLen * 0.22));
      st.position.y += 0.012;
      g.add(st);
    }
    const eng = new THREE.MeshStandardMaterial({
      color: 0x1a1c22, metalness: 0.75, roughness: 0.35, flatShading: true,
    });
    const glow = new THREE.MeshBasicMaterial({ color: 0x662211, transparent: true, opacity: 0.85 });
    for (const raw of dirs) {
      const d = raw.clone().normalize();
      const p = bodyC.clone().add(d.clone().multiplyScalar(0.14)).add(new THREE.Vector3(0, 0, 0.34));
      const e = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.14, 6), eng);
      e.rotation.x = Math.PI / 2;
      e.position.copy(p);
      g.add(e);
      const gl = new THREE.Mesh(new THREE.CircleGeometry(0.048, 6), glow);
      gl.rotation.x = -Math.PI / 2;
      gl.position.copy(p).add(new THREE.Vector3(0, 0, 0.09));
      g.add(gl);
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    return g;
  }

  /** Low-poly Y-wing (nose −Z, rear +Z) — nacelles tied in with struts + crossbar, not three blobs. */
  _buildFinaleMiniYWing() {
    const g = new THREE.Group();
    const hull = new THREE.MeshStandardMaterial({
      color: 0xa8a69a, metalness: 0.42, roughness: 0.46, flatShading: true,
    });
    const nacelle = new THREE.MeshStandardMaterial({
      color: 0x6e6a62, metalness: 0.52, roughness: 0.42, flatShading: true,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x4a4844, metalness: 0.55, roughness: 0.5, flatShading: true,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: 0xc9a020, metalness: 0.38, roughness: 0.48, flatShading: true,
    });

    const nacelleCx = 0.58;
    const fuselageHalfW = 0.17;
    const innerNacelleX = nacelleCx - 0.14;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.72), hull);
    deck.position.set(0, 0.2, 0.04);
    g.add(deck);

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.32), hull);
    cockpit.position.set(0, 0.23, -0.38);
    g.add(cockpit);
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.06, 0.16),
      new THREE.MeshStandardMaterial({
        color: 0x1e2228, metalness: 0.7, roughness: 0.25, flatShading: true,
      })
    );
    canopy.position.set(0, 0.28, -0.42);
    g.add(canopy);

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.28), dark);
    neck.position.set(0, 0.18, 0.38);
    g.add(neck);

    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(nacelleCx * 2 + 0.26, 0.06, 0.1), dark);
    crossBar.position.set(0, 0.2, 0.44);
    g.add(crossBar);

    for (const side of [-1, 1]) {
      const sx = side;
      const mainStrut = new THREE.Mesh(new THREE.BoxGeometry(innerNacelleX - fuselageHalfW, 0.055, 0.1), accent);
      mainStrut.position.set(sx * (fuselageHalfW + mainStrut.geometry.parameters.width * 0.5), 0.19, 0.02);
      g.add(mainStrut);

      const aftStrut = new THREE.Mesh(new THREE.BoxGeometry(innerNacelleX - fuselageHalfW - 0.04, 0.048, 0.08), dark);
      aftStrut.position.set(sx * (fuselageHalfW + aftStrut.geometry.parameters.width * 0.5), 0.17, 0.28);
      g.add(aftStrut);

      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.62, 10), nacelle);
      pod.rotation.x = Math.PI / 2;
      pod.position.set(sx * nacelleCx, 0.18, 0.1);
      g.add(pod);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), hull);
      dome.position.set(sx * nacelleCx, 0.18, -0.24);
      g.add(dome);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 6, 14), accent);
      band.rotation.x = Math.PI / 2;
      band.position.set(sx * nacelleCx, 0.18, -0.18);
      g.add(band);

      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 8), dark);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(sx * nacelleCx, 0.18, 0.44);
      g.add(nozzle);
    }

    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.28, 6), hull);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.2, -0.62);
    g.add(nose);
    for (const sx of [-0.06, 0.06]) {
      const cn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.22, 5), dark);
      cn.rotation.x = Math.PI / 2;
      cn.position.set(sx, 0.19, -0.78);
      g.add(cn);
    }

    const turret = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.08), dark);
    turret.position.set(0, 0.3, -0.28);
    g.add(turret);

    g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    return g;
  }

  /**
   * Escape finale sky — dense star shell. `fog: false` so scene fog does not wash them to black.
   * Two layers: distant dome + nearer specks so the frame reads as space, not empty void.
   * Stars are rejected inside an exclusion sphere around the finale Death Star so they don’t sit on the mesh.
   */
  _addFinaleStarfield(parent) {
    /** Keep in sync with `_spawnDeathStarFinale` dsGrp.position + sphere (~56) + trench/dish margin. */
    const dsExcl = new THREE.Vector3(-46, 28, -272);
    const dsExclR = 94;
    const dsExclR2 = dsExclR * dsExclR;
    const p = new THREE.Vector3();
    const dir = new THREE.Vector3();

    const mkLayer = (count, rMin, rMax, ySquash, zBias, size, opacity, color) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        let placed = false;
        for (let attempt = 0; attempt < 80 && !placed; attempt++) {
          const u = Math.random() * Math.PI * 2;
          const c = 2 * Math.random() - 1;
          const s = Math.sqrt(Math.max(0, 1 - c * c));
          const rr = rMin + Math.random() * (rMax - rMin);
          p.set(
            rr * s * Math.cos(u),
            rr * s * Math.sin(u) * ySquash + (Math.random() - 0.5) * 120,
            zBias - Math.random() * (rMax * 0.85),
          );
          if (p.distanceToSquared(dsExcl) >= dsExclR2) {
            placed = true;
          }
        }
        if (!placed) {
          dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
          if (dir.lengthSq() < 1e-6) dir.set(0.37, 0.52, -0.78);
          dir.normalize();
          p.copy(dsExcl).addScaledVector(dir, dsExclR + 40 + Math.random() * (rMax - rMin));
        }
        pos[i * 3] = p.x;
        pos[i * 3 + 1] = p.y;
        pos[i * 3 + 2] = p.z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color,
          size,
          transparent: true,
          opacity,
          depthWrite: false,
          sizeAttenuation: true,
          fog: false,
        }),
      );
      parent.add(pts);
    };
    mkLayer(2200, 280, 720, 0.62, -120, 0.42, 0.88, 0xf2f6ff);
    mkLayer(900, 120, 340, 0.75, -40, 0.28, 0.72, 0xd8e4ff);
  }

  _spawnDeathStarFinale() {
    this._cleanupDeathStarFinale();

    this._dsFinaleCamFrom.copy(this.camera.position);
    const lookDir = new THREE.Vector3();
    this.camera.getWorldDirection(lookDir);
    this._dsFinaleLookFrom.copy(this.camera.position).addScaledVector(lookDir, 70);

    this._dsFinalePrevVis = [];
    const hide = (o) => {
      if (!o) return;
      this._dsFinalePrevVis.push({ o, v: o.visible });
      o.visible = false;
    };
    hide(this.track?.group);
    hide(this.player.mesh);
    for (const e of this.spawner.obstacles) hide(e.mesh);
    for (const e of this.spawner.pickups) hide(e.mesh);
    for (const e of this.spawner.rivals) hide(e.mesh);

    if (this.scene.background && typeof this.scene.background.clone === "function") {
      this._dsSceneBgRestore = this.scene.background.clone();
    } else {
      this._dsSceneBgRestore = null;
    }
    this.scene.background = new THREE.Color(0x000205);

    if (this.scene.fog instanceof THREE.Fog) {
      this._dsFogRestore = { near: this.scene.fog.near, far: this.scene.fog.far };
      this.scene.fog.near = 8;
      this.scene.fog.far = 960;
    }

    const g = new THREE.Group();
    this._dsFinaleGroup = g;
    this.scene.add(g);

    /** Track lights live under `track.group`; hiding the trench removed all lights, so Standard materials read black. */
    const finHemi = new THREE.HemisphereLight(0xc8d6ee, 0x1c222a, 0.78);
    g.add(finHemi);
    g.add(new THREE.AmbientLight(0x6a7580, 0.42));
    const finKey = new THREE.DirectionalLight(0xfff6ec, 0.95);
    finKey.position.set(-90, 95, 40);
    g.add(finKey);
    const finRim = new THREE.DirectionalLight(0x8aa0c0, 0.4);
    finRim.position.set(100, 55, -30);
    g.add(finRim);

    this._addFinaleStarfield(g);

    const dsMat = new THREE.MeshStandardMaterial({
      color: 0x7a7e8a,
      roughness: 0.84,
      metalness: 0.2,
      emissive: 0x1a2230,
      emissiveIntensity: 0.55,
      flatShading: true,
    });
    const trenchMat = new THREE.MeshStandardMaterial({
      color: 0x1c2028,
      roughness: 0.95,
      metalness: 0.12,
      flatShading: true,
    });
    const equatorLineMat = new THREE.MeshStandardMaterial({
      color: 0x080a10,
      roughness: 0.9,
      metalness: 0.22,
      emissive: 0x040508,
      emissiveIntensity: 0.4,
      flatShading: true,
    });
    const dishRimMat = new THREE.MeshStandardMaterial({
      color: 0x8a909c,
      roughness: 0.72,
      metalness: 0.38,
      emissive: 0x2a3448,
      emissiveIntensity: 0.45,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    const dishWellMat = new THREE.MeshStandardMaterial({
      color: 0x1e222c,
      roughness: 0.92,
      metalness: 0.14,
      emissive: 0x182840,
      emissiveIntensity: 0.35,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    const dishCollarMat = new THREE.MeshStandardMaterial({
      color: 0x5c6472,
      roughness: 0.8,
      metalness: 0.35,
      emissive: 0x1a2030,
      emissiveIntensity: 0.28,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const dsGrp = new THREE.Group();
    /** Nearer + larger so it stays in frame with the fighters (was too small / off-axis). */
    dsGrp.position.set(-46, 28, -272);
    dsGrp.add(new THREE.Mesh(new THREE.SphereGeometry(56, 22, 18), dsMat));

    // Equator: broad trench band + thin dark line on the true equator (XZ plane).
    const trenchBand = new THREE.Mesh(new THREE.TorusGeometry(56.75, 0.95, 8, 56), trenchMat);
    trenchBand.rotation.x = Math.PI / 2;
    trenchBand.scale.set(1, 0.16, 1);
    dsGrp.add(trenchBand);
    const equatorLine = new THREE.Mesh(new THREE.TorusGeometry(56.08, 0.26, 6, 72), equatorLineMat);
    equatorLine.rotation.x = Math.PI / 2;
    dsGrp.add(equatorLine);

    // Superlaser dish — above the equatorial trench (blend toward +Y) while still facing the camera enough to read.
    const toCam = this._dsFinaleCamFrom.clone().sub(dsGrp.position);
    if (toCam.lengthSq() < 4) {
      toCam.set(0.22, 0.38, 0.9);
    }
    toCam.normalize();
    const upBias = 0.52;
    const dishNormal = toCam
      .multiplyScalar(1 - upBias)
      .add(new THREE.Vector3(0, upBias, 0))
      .normalize();
    const dishRadius = 55.65;
    const dishGrp = new THREE.Group();
    dishGrp.position.copy(dishNormal.clone().multiplyScalar(dishRadius));
    dishGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dishNormal);
    const dishWell = new THREE.Mesh(new THREE.CircleGeometry(6.4, 28), dishWellMat);
    dishWell.position.z = -0.48;
    dishGrp.add(dishWell);
    const dishMain = new THREE.Mesh(new THREE.RingGeometry(6.55, 14.8, 40), dishRimMat);
    dishGrp.add(dishMain);
    const dishCollar = new THREE.Mesh(new THREE.RingGeometry(14.6, 16.4, 40), dishCollarMat);
    dishCollar.position.z = 0.12;
    dishGrp.add(dishCollar);
    const dishTorus = new THREE.Mesh(new THREE.TorusGeometry(10.6, 0.42, 10, 48), dishCollarMat);
    dishTorus.position.z = 0.06;
    dishGrp.add(dishTorus);
    dsGrp.add(dishGrp);

    g.add(dsGrp);
    this._dsFinaleDsMesh = dsGrp;

    const boomMat = new THREE.MeshStandardMaterial({
      color: 0xff5520,
      emissive: 0xff3300,
      emissiveIntensity: 1.45,
      transparent: true,
      opacity: 0.92,
    });
    const boom = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 16), boomMat);
    boom.position.copy(dsGrp.position);
    boom.visible = false;
    boom.scale.setScalar(0.06);
    g.add(boom);
    this._dsFinaleBoom = boom;

    const n = 340;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const vel = [];
    for (let i = 0; i < n; i++) {
      pos[i * 3] = boom.position.x;
      pos[i * 3 + 1] = boom.position.y;
      pos[i * 3 + 2] = boom.position.z;
      vel.push({ vx: 0, vy: 0, vz: 0 });
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffcc88,
      size: 0.34,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const pts = new THREE.Points(geo, pMat);
    pts.userData.vel = vel;
    g.add(pts);
    this._dsFinaleParticles = pts;

    const xL = this._buildFinaleMiniXWing();
    xL.scale.setScalar(2.45);
    xL.position.set(3.4, 5.55, -108);
    /** Models are built nose −Z; flight is +Z toward camera — yaw π so nose leads. */
    xL.rotation.y = Math.PI;
    g.add(xL);
    const xC = this._buildFinaleMiniXWing();
    xC.scale.setScalar(2.55);
    xC.position.set(0, 5.75, -92);
    xC.rotation.y = Math.PI;
    g.add(xC);
    const yW = this._buildFinaleMiniYWing();
    yW.scale.setScalar(2.25);
    yW.position.set(-3.5, 5.4, -100);
    yW.rotation.y = Math.PI;
    g.add(yW);

    g.userData.finaleShips = [
      { grp: xL, vz: 11 },
      { grp: xC, vz: 13 },
      { grp: yW, vz: 10 },
    ];
    g.userData.dsPos = dsGrp.position.clone();
    g.userData.explosionPrimed = false;

    playFinaleBed(SFX.DS_FINAL_SCENE, 0.52);
  }

  _cleanupDeathStarFinale() {
    stopFinaleBed();
    if (this._dsFinalePrevVis) {
      for (const { o, v } of this._dsFinalePrevVis) o.visible = v;
      this._dsFinalePrevVis = null;
    }
    if (this._dsSceneBgRestore != null) {
      this.scene.background = this._dsSceneBgRestore;
      this._dsSceneBgRestore = null;
    }
    this._dsFinaleDsMesh = null;
    if (this._dsFogRestore && this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.near = this._dsFogRestore.near;
      this.scene.fog.far = this._dsFogRestore.far;
    }
    this._dsFogRestore = null;
    if (this._dsFinaleGroup) {
      this.scene.remove(this._dsFinaleGroup);
      this._dsFinaleGroup.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          const m = c.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      this._dsFinaleGroup = null;
    }
    this._dsFinaleBoom = null;
    this._dsFinaleParticles = null;
  }

  _updateDeathStarFinale(dt, now) {
    const g = this._dsFinaleGroup;
    const t = (now - this._orbitStartTime) / 1000;
    const explodeAt = 3.35;

    if (this._dsFinaleDsMesh && this._dsFinaleDsMesh.visible) {
      this._dsFinaleDsMesh.rotation.y += 0.045 * dt;
    }

    if (g?.userData.finaleShips) {
      for (const s of g.userData.finaleShips) {
        s.grp.position.z += s.vz * dt;
        s.grp.rotation.z = Math.sin(t * 1.05 + s.grp.position.x * 0.06) * 0.045;
      }
    }

    if (
      g &&
      this._dsFinaleDsMesh &&
      t >= explodeAt &&
      this._dsFinaleDsMesh.visible &&
      !g.userData.explosionPrimed
    ) {
      g.userData.explosionPrimed = true;
      this._dsFinaleDsMesh.visible = false;
      if (this._dsFinaleBoom) this._dsFinaleBoom.visible = true;
      stopFinaleBed();
      play(SFX.DS_DEATH_STAR_EXPLOSION, 0.92);
      const pMat = /** @type {THREE.PointsMaterial|null} */ (
        this._dsFinaleParticles && this._dsFinaleParticles.material
      );
      if (pMat) pMat.opacity = 0.78;
      const vel = this._dsFinaleParticles?.userData.vel;
      const bp = g.userData.dsPos;
      if (vel && bp && this._dsFinaleParticles) {
        const posAttr = this._dsFinaleParticles.geometry.attributes.position;
        const arr = /** @type {Float32Array} */ (posAttr.array);
        for (let i = 0; i < vel.length; i++) {
          arr[i * 3] = bp.x + (Math.random() - 0.5) * 3;
          arr[i * 3 + 1] = bp.y + (Math.random() - 0.5) * 3;
          arr[i * 3 + 2] = bp.z + (Math.random() - 0.5) * 3;
          vel[i] = {
            vx: (Math.random() - 0.5) * 78,
            vy: (Math.random() - 0.5) * 68 + 22,
            vz: 42 + Math.random() * 58,
          };
        }
        posAttr.needsUpdate = true;
      }
    }

    const tb = Math.max(0, t - explodeAt);
    if (this._dsFinaleBoom && this._dsFinaleBoom.visible) {
      const s = 0.06 + Math.min(16, tb * tb * 3.8 + tb * 2.8);
      this._dsFinaleBoom.scale.setScalar(s);
      const mat = /** @type {THREE.MeshStandardMaterial} */ (this._dsFinaleBoom.material);
      if (mat?.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = Math.max(0.12, 1.85 - tb * 0.36);
        mat.opacity = Math.max(0, 0.92 - tb * 0.12);
      }
    }
    if (
      this._dsFinaleParticles &&
      this._dsFinaleParticles.userData.vel &&
      t >= explodeAt
    ) {
      const posAttr = this._dsFinaleParticles.geometry.attributes.position;
      const arr = /** @type {Float32Array} */ (posAttr.array);
      const vel = this._dsFinaleParticles.userData.vel;
      for (let i = 0; i < vel.length; i++) {
        arr[i * 3] += vel[i].vx * dt;
        arr[i * 3 + 1] += vel[i].vy * dt;
        arr[i * 3 + 2] += vel[i].vz * dt;
        vel[i].vy -= 10 * dt;
        vel[i].vx *= 0.991;
        vel[i].vz *= 0.993;
      }
      posAttr.needsUpdate = true;
    }
  }

  _updateOrbitCamera(dt, now) {
    const elapsed = (now - this._orbitStartTime) / 1000;
    if (this.currentLevel === "DS") {
      this._updateDeathStarFinale(dt, now);
      this._updateDsProtonTorpedoes(dt);
      const settle = Math.min(1, elapsed / 0.52);
      const ease = 1 - (1 - settle) ** 2.35;
      const camTx = 0;
      const camTy = 10.5;
      const camTz = 44;
      this.camera.position.set(
        THREE.MathUtils.lerp(this._dsFinaleCamFrom.x, camTx, ease),
        THREE.MathUtils.lerp(this._dsFinaleCamFrom.y, camTy, ease),
        THREE.MathUtils.lerp(this._dsFinaleCamFrom.z, camTz, ease),
      );
      const lx0 = THREE.MathUtils.lerp(this._dsFinaleLookFrom.x, -6, ease);
      const ly0 = THREE.MathUtils.lerp(this._dsFinaleLookFrom.y, 5.65, ease);
      const lz0 = THREE.MathUtils.lerp(this._dsFinaleLookFrom.z, -118, ease);
      const w = Math.sin(elapsed * 0.28) * 0.22;
      this.camera.lookAt(lx0 + w * 0.25, ly0 + w * 0.08, lz0 + w * 0.35);
      return;
    }
    const angle = elapsed * 0.5;
    const radius = 8;
    const height = 4;
    const center = this._orbitCenter;
    this.camera.position.set(
      center.x + Math.sin(angle) * radius,
      center.y + height + Math.sin(elapsed * 0.3) * 0.5,
      center.z + Math.cos(angle) * radius
    );
    this.camera.lookAt(center.x, center.y + 1.2, center.z);
  }

  // ── Celebration crowd + confetti ──

  _buildCheeringPerson(shirtColor) {
    const g = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xf4c18a });
    const shirt = new THREE.MeshStandardMaterial({ color: shirtColor });
    const pants = new THREE.MeshStandardMaterial({ color: 0x334466 });
    const shoe = new THREE.MeshStandardMaterial({ color: 0x222222 });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), skin);
    head.position.y = 1.55;
    g.add(head);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.22), shirt);
    torso.position.y = 1.1;
    g.add(torso);

    // Arms raised in a V
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), skin);
      arm.position.set(side * 0.32, 1.45, 0);
      arm.rotation.z = side * -0.6;
      g.add(arm);
    }

    // Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), pants);
      leg.position.set(side * 0.1, 0.5, 0);
      g.add(leg);
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.2), shoe);
      s.position.set(side * 0.1, 0.22, 0.03);
      g.add(s);
    }

    g.traverse((c) => {
      if (c.isMesh) {
        c.material.transparent = true;
        c.material.opacity = 0;
      }
    });

    return g;
  }

  _spawnCelebration(center) {
    this._cleanupCelebration();

    const shirtColors = [
      0xee1133, 0x2288ff, 0x22cc55, 0xffaa00, 0xcc44ff,
      0xff6622, 0x00ccbb, 0xff2288, 0x8855ff, 0xffdd00,
    ];

    const crowdRadius = 4.5;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const person = this._buildCheeringPerson(shirtColors[i]);
      person.position.set(
        center.x + Math.sin(angle) * crowdRadius,
        CONFIG.PLAYER_Y,
        center.z + Math.cos(angle) * crowdRadius
      );
      person.lookAt(center.x, CONFIG.PLAYER_Y + 1, center.z);
      person.userData.phase = Math.random() * Math.PI * 2;
      person.userData.baseY = CONFIG.PLAYER_Y;
      this.scene.add(person);
      this._celebCrowd.push(person);
    }

    // Confetti burst
    const confettiColors = [0xff2255, 0x22ccff, 0xffdd00, 0x44ff66, 0xff8800, 0xcc44ff, 0xffffff];
    for (let i = 0; i < 80; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: confettiColors[i % confettiColors.length],
        transparent: true,
        opacity: 0,
      });
      const size = 0.06 + Math.random() * 0.08;
      const geo = new THREE.BoxGeometry(size, size * 0.3, size);
      const c = new THREE.Mesh(geo, mat);
      const spread = 5;
      c.position.set(
        center.x + (Math.random() - 0.5) * spread * 2,
        CONFIG.PLAYER_Y + 6 + Math.random() * 6,
        center.z + (Math.random() - 0.5) * spread * 2
      );
      c.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      c.userData.vy = -(1.0 + Math.random() * 1.5);
      c.userData.vx = (Math.random() - 0.5) * 1.2;
      c.userData.vz = (Math.random() - 0.5) * 1.2;
      c.userData.spin = (Math.random() - 0.5) * 6;
      this.scene.add(c);
      this._celebConfetti.push(c);
    }
  }

  _updateCelebration(dt, now) {
    if (this.currentLevel === "DS") return;
    const elapsed = (now - this._orbitStartTime) / 1000;
    const fadeIn = Math.min(1, elapsed / 1.5);

    this.player.updateCelebration(dt, elapsed);

    for (const person of this._celebCrowd) {
      person.traverse((c) => {
        if (c.isMesh) c.material.opacity = fadeIn;
      });
      const bounce = Math.abs(Math.sin((elapsed * 5) + person.userData.phase)) * 0.2;
      person.position.y = person.userData.baseY + bounce;
      // Arms pump: vary the arm rotation with time
      const children = person.children;
      for (const child of children) {
        if (child.rotation && Math.abs(child.rotation.z) > 0.3) {
          const side = child.rotation.z < 0 ? -1 : 1;
          child.rotation.z = side * -(0.4 + Math.sin((elapsed * 6) + person.userData.phase) * 0.3);
        }
      }
    }

    for (const c of this._celebConfetti) {
      c.material.opacity = fadeIn;
      c.position.y += c.userData.vy * dt;
      c.position.x += c.userData.vx * dt;
      c.position.z += c.userData.vz * dt;
      c.rotation.x += c.userData.spin * dt;
      c.rotation.z += c.userData.spin * 0.7 * dt;
      if (c.position.y < CONFIG.PLAYER_Y) {
        c.position.y = CONFIG.PLAYER_Y + 8 + Math.random() * 4;
      }
    }
  }

  _cleanupCelebration() {
    for (const p of this._celebCrowd) {
      this.scene.remove(p);
      p.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
    }
    this._celebCrowd = [];
    for (const c of this._celebConfetti) {
      this.scene.remove(c);
      c.geometry.dispose();
      c.material.dispose();
    }
    this._celebConfetti = [];
  }

  /** Chase cam while DS finish line: ship climbs at cruise speed before finale cut. */
  _updateCameraDsFinishBreakaway(dt, now, ease) {
    const px = this.player.mesh.position.x;
    const camLift = ease * 5.1;
    const lookLift = ease * 4.0;
    const camBack = ease * 0.55;
    const target = new THREE.Vector3(
      px * 0.3,
      this.cameraBase.y + camLift,
      this.cameraBase.z + camBack
    );
    this.camera.position.lerp(target, 1 - Math.exp(-3.4 * dt));

    let shake = 0;
    if (now < this.shakeUntil) {
      shake =
        this.shakeAmp *
        Math.sin(now * 0.08) *
        ((this.shakeUntil - now) / 200);
    }
    this.camera.position.x += shake;
    this.camera.lookAt(px * 0.15, 1.15 + lookLift, -2 + ease * 0.35);
  }

  _updateCamera(dt, now) {
    const px = this.player.mesh.position.x;
    const target = new THREE.Vector3(
      px * 0.3,
      this.cameraBase.y,
      this.cameraBase.z
    );
    this.camera.position.lerp(target, 1 - Math.exp(-4 * dt));

    let shake = 0;
    if (now < this.shakeUntil) {
      shake =
        this.shakeAmp *
        Math.sin(now * 0.08) *
        ((this.shakeUntil - now) / 200);
    }
    this.camera.position.x += shake;
    this.camera.lookAt(px * 0.15, 1.2, -2);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
