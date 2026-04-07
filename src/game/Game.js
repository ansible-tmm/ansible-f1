import * as THREE from "three";
import { CONFIG } from "../data/config.js";
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
} from "../utils/storage.js";

/**
 * @typedef {'boot'|'main_menu'|'running'|'quiz'|'paused'|'game_over'} GameState
 */

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

    this.player = new Player(scene);
    this.track = new Track(scene);
    this.spawner = new Spawner(scene);
    this.collision = new CollisionSystem(this.player);
    this.quiz = new QuizSystem();

    this.runTime = 0;
    this.stability = CONFIG.STARTING_STABILITY;
    this.score = 0;
    this.streak = 0;
    this.worldSpeed = CONFIG.BASE_SPEED;

    this.shield = false;
    this.boostUntil = 0;
    this.automationFlowUntil = 0;

    this.obstaclesHit = 0;
    this.pickupsCollected = 0;
    this.sessionCorrect = 0;

    this.recoveryPrompt = false;
    this.timeScale = 1;

    this.cameraBase = new THREE.Vector3(0, 5.2, 12);
    this.shakeUntil = 0;
    this.shakeAmp = 0;

    this._lastTs = performance.now();
    this._scrollForTrack = 0;

    this._bindKeys();
    this._bindQuizUi();
    this._quizBusy = false;
  }

  _bindKeys() {
    window.addEventListener("keydown", (e) => {
      if (this.state === "main_menu" || this.state === "game_over") return;

      if (this.state === "quiz" && this.currentQuestion) {
        const k = e.key;
        if (k >= "1" && k <= "4") {
          this._answerQuiz(Number(k) - 1);
          e.preventDefault();
        }
        return;
      }

      if (this.state === "quiz") return;

      if (e.code === "Escape") {
        if (this.state === "paused") {
          this.state = "running";
          this.ui.showPause(false);
        } else if (this.state === "running" && !this.recoveryPrompt) {
          this.state = "paused";
          this.ui.showPause(true);
        }
        e.preventDefault();
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
    });
  }

  _bindQuizUi() {
    const opts = this.ui.el.quizOpts;
    if (opts) {
      opts.addEventListener("click", (ev) => {
        const t = /** @type {HTMLElement} */ (ev.target);
        if (t && t.dataset && t.dataset.index !== undefined) {
          this._answerQuiz(Number(t.dataset.index));
        }
      });
    }
  }

  startFromMenu() {
    this.resetRun();
    this.state = "running";
    this.ui.showMainMenu(false);
    this.ui.showGameOver(false);
    this.ui.showPause(false);
    this.ui.showHud(true);
    this.ui.setStatus("Go!", 1500);
  }

  resetRun() {
    incrementTotalRuns();
    this.quiz.resetPool();
    this.spawner.reset();
    this.runTime = 0;
    this.stability = CONFIG.STARTING_STABILITY;
    this.score = 0;
    this.streak = 0;
    this.worldSpeed = CONFIG.BASE_SPEED;
    this.shield = false;
    this.boostUntil = 0;
    this.automationFlowUntil = 0;
    this.obstaclesHit = 0;
    this.pickupsCollected = 0;
    this.sessionCorrect = 0;
    this.recoveryPrompt = false;
    this.timeScale = 1;
    this.player.targetLaneIndex = 1;
    this.player.laneIndex = 1;
    this.player.mesh.position.x = CONFIG.LANES[1];
  }

  resume() {
    this.state = "running";
    this.ui.showPause(false);
  }

  restartFromPause() {
    this.ui.showPause(false);
    this.startFromMenu();
  }

  backToMenu() {
    this.state = "main_menu";
    this.recoveryPrompt = false;
    this.timeScale = 1;
    this.ui.showGameOver(false);
    this.ui.showPause(false);
    this.ui.showHud(false);
    this.ui.showMainMenu(true);
    this.ui.updateMenuBest(getBestScore());
  }

  _answerQuiz(optionIndex) {
    if (this.state !== "quiz" || !this.currentQuestion || this._quizBusy) return;
    this._quizBusy = true;
    const q = this.currentQuestion;
    const ok = this.quiz.isCorrect(q, optionIndex);

    this.ui.showQuizExplanation(q.explanation);
    window.setTimeout(() => {
      this.ui.hideQuizExplanation();
      this._finishQuiz(ok);
      this._quizBusy = false;
    }, CONFIG.QUIZ_EXPLANATION_MS);
  }

  _finishQuiz(correct) {
    const mode = this.quizMode;
    this.ui.showQuiz(false);
    this.state = "running";
    this.quizMode = null;
    this.currentQuestion = null;
    this.timeScale = 1;

    if (mode === "boost") {
      if (correct) {
        this.streak += 1;
        this.score += CONFIG.BOOST_QUIZ_CORRECT * this._flowMult();
        this.sessionCorrect += 1;
        addTotalCorrectAnswers(1);
        this.boostUntil = performance.now() + CONFIG.BOOST_DURATION * 1000;
        this.ui.setStatus("Correct: Speed Boost", CONFIG.STATUS_MESSAGE_MS);
        this._checkStreakAutomation();
      } else {
        this.streak = 0;
        this.score += CONFIG.BOOST_QUIZ_WRONG * this._flowMult();
        this.ui.setStatus("Wrong answer", CONFIG.STATUS_MESSAGE_MS);
      }
    } else if (mode === "recovery") {
      if (correct) {
        this.stability = Math.min(
          CONFIG.STARTING_STABILITY,
          this.stability + CONFIG.REMEDIATION_RESTORE
        );
        this.streak += CONFIG.REMEDIATION_CORRECT_STREAK;
        this.sessionCorrect += 1;
        addTotalCorrectAnswers(1);
        this.ui.setStatus("Stability restored", CONFIG.STATUS_MESSAGE_MS);
        this._checkStreakAutomation();
      } else {
        this.streak = 0;
        this.stability -= CONFIG.REMEDIATION_WRONG_PENALTY;
        this.ui.setStatus("Remediation failed", CONFIG.STATUS_MESSAGE_MS);
        if (this.stability <= 0) {
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
      this.ui.setStatus("Automation Flow active", CONFIG.STATUS_MESSAGE_MS);
    }
  }

  _flowMult() {
    const now = performance.now();
    const flow =
      now < this.automationFlowUntil ? CONFIG.FLOW_SCORE_MULT : 1;
    return flow;
  }

  _gameOver() {
    this.state = "game_over";
    this.timeScale = 1;
    this.recoveryPrompt = false;
    this.player.setAutomationFlowActive(false);
    const best = getBestScore();
    setBestScoreIfHigher(this.score);
    this.ui.setGameOverStats({
      score: this.score,
      best: Math.max(best, this.score),
      hits: this.obstaclesHit,
      pickups: this.pickupsCollected,
      correct: this.sessionCorrect,
    });
    this.ui.showHud(false);
    this.ui.showGameOver(true);
  }

  /** Recovery prompt */
  onRecoveryYes() {
    if (!this.recoveryPrompt) return;
    this.recoveryPrompt = false;
    this.ui.showRecovery(false);
    this.currentQuestion = this.quiz.nextQuestion();
    this.quizMode = "recovery";
    this.state = "quiz";
    this.timeScale = CONFIG.RECOVERY_SLOW_SCALE;
    this.ui.renderQuizQuestion(this.currentQuestion);
    this.ui.showQuiz(true);
  }

  onRecoveryNo() {
    if (!this.recoveryPrompt) return;
    this.recoveryPrompt = false;
    this.ui.showRecovery(false);
    this.timeScale = 1;
  }

  _openBoostQuiz() {
    this.currentQuestion = this.quiz.nextQuestion();
    this.quizMode = "boost";
    this.state = "quiz";
    this.timeScale = CONFIG.BOOST_SLOW_SCALE;
    this.ui.renderQuizQuestion(this.currentQuestion);
    this.ui.showQuiz(true);
    this.ui.setStatus("Boost ready", 1200);
  }

  update() {
    const now = performance.now();
    let dt = Math.min(0.05, (now - this._lastTs) / 1000);
    this._lastTs = now;

    if (this.state === "boot" || this.state === "main_menu") {
      this._updateCamera(dt, now);
      return;
    }

    if (this.state === "paused" || this.state === "game_over") {
      this._updateCamera(dt, now);
      return;
    }

    const ts = this.recoveryPrompt
      ? 0
      : this.state === "quiz"
        ? this.timeScale
        : 1;
    const effDt = dt * ts;

    if (this.state === "running" || this.state === "quiz") {
      this._updateRun(effDt, now, dt, ts);
    }

    this._updateCamera(dt, now);
  }

  _updateRun(effDt, now, rawDt, spawnScale) {
    this.runTime += effDt;
    this._scrollForTrack += this.worldSpeed * effDt;
    this.track.update(effDt, this._scrollForTrack);

    const ramp = Math.min(
      CONFIG.MAX_SPEED_MULT,
      1 + this.runTime * CONFIG.SPEED_RAMP * 0.02
    );
    let speedMult = ramp;

    if (now < this.boostUntil) {
      speedMult *= CONFIG.BOOST_SPEED_MULT;
    }

    const ws = CONFIG.BASE_SPEED * speedMult;
    this.worldSpeed = ws;

    const flowActive = now < this.automationFlowUntil;
    this.player.setAutomationFlowActive(flowActive);

    const fm = flowActive ? CONFIG.FLOW_SCORE_MULT : 1;
    this.score +=
      (CONFIG.SCORE_PER_SECOND * fm + CONFIG.SCORE_PER_UNIT_DISTANCE * ws * fm) *
      effDt;

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

    const entities = this.spawner.getAllCollidable();
    const hits = this.collision.testEntities(entities);
    const obstacleHits = hits.filter((h) => h.entity.kind === "obstacle");
    const pickupHits = hits.filter((h) => h.entity.kind === "pickup");

    if (obstacleHits.length) {
      this._onHitObstacle(obstacleHits[0].entity);
    } else if (pickupHits.length) {
      this._onPickup(pickupHits[0].entity);
    }

    this.ui.updateHud({
      stability: this.stability,
      score: this.score,
      speed: ws,
      streak: this.streak,
      shield: this.shield,
      automationFlow: flowActive,
      boostRemaining: Math.max(0, this.boostUntil - now),
      boostTotal: CONFIG.BOOST_DURATION * 1000,
    });
  }

  _onHitObstacle(e) {
    this.spawner.removeEntity(e);
    if (this.shield) {
      this.shield = false;
      this.ui.setStatus("Shield absorbed impact", CONFIG.STATUS_MESSAGE_MS);
      return;
    }

    const dmg =
      CONFIG.DAMAGE[e.subtype] ?? 15;
    this.stability -= dmg;
    this.obstaclesHit += 1;
    this.ui.flashDamage();
    this.ui.shake();
    this.shakeUntil = performance.now() + 200;
    this.shakeAmp = 0.35;

    if (this.stability <= 0) {
      this._gameOver();
      return;
    }

    this.recoveryPrompt = true;
    this.ui.showRecovery(true);
  }

  _onPickup(e) {
    const t = e.subtype;
    this.spawner.removeEntity(e);
    this.pickupsCollected += 1;

    if (t === "PLAYBOOK") {
      this.score += CONFIG.PICKUP_SCORE.PLAYBOOK * this._flowMult();
    } else if (t === "CERTIFIED_COLLECTION") {
      this.score += CONFIG.PICKUP_SCORE.COLLECTION * this._flowMult();
    } else if (t === "POLICY_SHIELD") {
      this.shield = true;
      this.ui.setStatus("Shield online", CONFIG.STATUS_MESSAGE_MS);
    } else if (t === "BOOST_TOKEN") {
      this._openBoostQuiz();
    }
  }

  _updateCamera(dt, now) {
    const px = this.player.mesh.position.x;
    const target = new THREE.Vector3(
      px * 0.35,
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
    this.camera.lookAt(px * 0.2, 1.2, -2);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
