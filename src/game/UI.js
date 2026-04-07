/**
 * DOM overlays + HUD updates (Built to Automate)
 */
export class UI {
  constructor() {
    this.el = {
      mainMenu: document.getElementById("main-menu"),
      pauseMenu: document.getElementById("pause-menu"),
      gameOver: document.getElementById("game-over"),
      quiz: document.getElementById("quiz-overlay"),
      recovery: document.getElementById("recovery-overlay"),
      hud: document.getElementById("hud"),
      flash: document.getElementById("screen-flash"),
      canvasWrap: document.getElementById("game-root"),

      stability: document.getElementById("hud-stability"),
      score: document.getElementById("hud-score"),
      speed: document.getElementById("hud-speed"),
      streak: document.getElementById("hud-streak"),
      shield: document.getElementById("hud-shield"),
      flow: document.getElementById("hud-flow"),
      status: document.getElementById("hud-status"),
      boostBar: document.getElementById("boost-bar"),
      boostFill: document.getElementById("boost-fill"),

      bestScoreMenu: document.getElementById("menu-best"),
      goScore: document.getElementById("go-score"),
      goBest: document.getElementById("go-best"),
      goHits: document.getElementById("go-hits"),
      goPickups: document.getElementById("go-pickups"),
      goCorrect: document.getElementById("go-correct"),

      quizPrompt: document.getElementById("quiz-prompt"),
      quizOpts: document.getElementById("quiz-options"),
      quizExplain: document.getElementById("quiz-explain"),
    };

    this._statusTimer = null;
    this._bindButtons();
  }

  _bindButtons() {
    const on = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", fn);
    };
    on("btn-start", () => this.onStart && this.onStart());
    on("btn-resume", () => this.onResume && this.onResume());
    on("btn-restart-pause", () => this.onRestart && this.onRestart());
    on("btn-restart-go", () => this.onRestart && this.onRestart());
    on("btn-menu-go", () => this.onMenu && this.onMenu());
    on("recovery-yes", () => this.onRecoveryYes && this.onRecoveryYes());
    on("recovery-no", () => this.onRecoveryNo && this.onRecoveryNo());
  }

  setHandlers(h) {
    this.onStart = h.onStart;
    this.onResume = h.onResume;
    this.onRestart = h.onRestart;
    this.onMenu = h.onMenu;
    this.onRecoveryYes = h.onRecoveryYes;
    this.onRecoveryNo = h.onRecoveryNo;
  }

  showMainMenu(visible) {
    this.el.mainMenu.classList.toggle("hidden", !visible);
  }

  showPause(visible) {
    this.el.pauseMenu.classList.toggle("hidden", !visible);
  }

  showGameOver(visible) {
    this.el.gameOver.classList.toggle("hidden", !visible);
  }

  showQuiz(visible) {
    this.el.quiz.classList.toggle("hidden", !visible);
  }

  showRecovery(visible) {
    this.el.recovery.classList.toggle("hidden", !visible);
  }

  showHud(visible) {
    this.el.hud.classList.toggle("hidden", !visible);
  }

  updateMenuBest(score) {
    if (this.el.bestScoreMenu) {
      this.el.bestScoreMenu.textContent = String(Math.floor(score));
    }
  }

  updateHud(data) {
    const {
      stability,
      score,
      speed,
      streak,
      shield,
      automationFlow,
      boostRemaining,
      boostTotal,
    } = data;
    if (this.el.stability)
      this.el.stability.textContent = `${Math.max(0, Math.floor(stability))}`;
    if (this.el.score) this.el.score.textContent = `${Math.floor(score)}`;
    if (this.el.speed)
      this.el.speed.textContent = `${speed.toFixed(1)}`;
    if (this.el.streak) this.el.streak.textContent = `${streak}`;
    if (this.el.shield) {
      this.el.shield.textContent = shield ? "Shield: ON" : "Shield: —";
      this.el.shield.classList.toggle("active", !!shield);
    }
    if (this.el.flow) {
      this.el.flow.textContent = automationFlow
        ? "Automation Flow"
        : "Flow: —";
      this.el.flow.classList.toggle("active", !!automationFlow);
    }
    if (this.el.boostBar && this.el.boostFill) {
      const active = boostTotal > 0 && boostRemaining > 0;
      this.el.boostBar.classList.toggle("hidden", !active);
      if (active) {
        const t = boostRemaining / boostTotal;
        this.el.boostFill.style.transform = `scaleX(${Math.max(0, Math.min(1, t))})`;
      }
    }
  }

  setStatus(text, ms = 2200) {
    if (!this.el.status) return;
    this.el.status.textContent = text;
    clearTimeout(this._statusTimer);
    this._statusTimer = setTimeout(() => {
      this.el.status.textContent = "";
    }, ms);
  }

  renderQuizQuestion(q) {
    if (!this.el.quizPrompt || !this.el.quizOpts) return;
    this.el.quizPrompt.textContent = q.prompt;
    this.el.quizOpts.innerHTML = "";
    q.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "quiz-opt";
      b.textContent = `${i + 1}. ${opt}`;
      b.dataset.index = String(i);
      this.el.quizOpts.appendChild(b);
    });
    if (this.el.quizExplain) {
      this.el.quizExplain.textContent = "";
      this.el.quizExplain.classList.add("hidden");
    }
  }

  showQuizExplanation(text) {
    if (!this.el.quizExplain) return;
    this.el.quizExplain.textContent = text;
    this.el.quizExplain.classList.remove("hidden");
  }

  hideQuizExplanation() {
    if (!this.el.quizExplain) return;
    this.el.quizExplain.textContent = "";
    this.el.quizExplain.classList.add("hidden");
  }

  flashDamage() {
    if (!this.el.flash) return;
    this.el.flash.classList.remove("flash-hit");
    void this.el.flash.offsetWidth;
    this.el.flash.classList.add("flash-hit");
    setTimeout(() => this.el.flash.classList.remove("flash-hit"), 120);
  }

  setGameOverStats(stats) {
    if (this.el.goScore) this.el.goScore.textContent = String(Math.floor(stats.score));
    if (this.el.goBest) this.el.goBest.textContent = String(Math.floor(stats.best));
    if (this.el.goHits) this.el.goHits.textContent = String(stats.hits);
    if (this.el.goPickups) this.el.goPickups.textContent = String(stats.pickups);
    if (this.el.goCorrect) this.el.goCorrect.textContent = String(stats.correct);
  }

  shake() {
    if (!this.el.canvasWrap) return;
    this.el.canvasWrap.classList.remove("shake");
    void this.el.canvasWrap.offsetWidth;
    this.el.canvasWrap.classList.add("shake");
  }
}
