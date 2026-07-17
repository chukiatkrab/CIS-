// ============================================================
// scenes/ClickChallengeScene.ts
//
// The "Click Challenge" minigame.
//
// Rules:
//   • Random coloured circles appear one at a time.
//   • Click a circle → +1 score, new circle spawns immediately.
//   • Game lasts 20 seconds.
//   • Score ≥ 15 → MISSION COMPLETE
//   • Score  < 15 → MISSION FAILED
//   • Press ENTER to return to CampusScene, carrying the result.
//
// ── HOW THE RESULT IS PASSED BACK ────────────────────────────
// When this scene calls scene.start("CampusScene", data),
// the data object is received by CampusScene.init(data).
// We pass { questCompleted: true/false } so CampusScene knows
// whether the quest was finished successfully.
// ============================================================

import Phaser from "phaser";

// ── Game constants ────────────────────────────────────────────
const GAME_DURATION   = 20;   // seconds
const WIN_SCORE       = 15;   // circles needed to win
const CIRCLE_MIN_R    = 24;   // smallest circle radius (px)
const CIRCLE_MAX_R    = 44;   // largest  circle radius (px)
const SAFE_TOP        = 80;   // keep circles below the HUD bar
const SAFE_MARGIN     = 50;   // keep circles away from screen edges

// Circle colours to randomly choose from
const CIRCLE_COLORS = [
  0xff4444, // red
  0x4488ff, // blue
  0xffcc00, // yellow
  0x44cc44, // green
  0xff88ff, // pink
];

export class ClickChallengeScene extends Phaser.Scene {

  // ── State ─────────────────────────────────────────────────
  private score      = 0;
  private timeLeft   = GAME_DURATION;
  private gameOver   = false;  // true once the 20-second timer ends

  // ── Current circle on screen ─────────────────────────────
  // We keep exactly ONE circle alive at a time.
  private circle: Phaser.GameObjects.Arc | null = null;

  // ── HUD text objects ─────────────────────────────────────
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  // ── ENTER key (used on the result screen) ─────────────────
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() { super("ClickChallengeScene"); }

  // ----------------------------------------------------------
  // create
  // Called once when this scene starts.
  // ----------------------------------------------------------
  create(): void {
    // Reset all state variables so the scene works if replayed.
    this.score    = 0;
    this.timeLeft = GAME_DURATION;
    this.gameOver = false;
    this.circle   = null;

    // ── Background ────────────────────────────────────────
    this.cameras.main.setBackgroundColor("#111122");

    // ── Score label (top-centre) ──────────────────────────
    this.scoreText = this.add.text(
      this.scale.width / 2, 20,
      "Score: 0",
      { fontSize: "24px", color: "#ffffff", fontStyle: "bold" }
    ).setOrigin(0.5, 0);

    // ── Timer label (top-right) ────────────────────────────
    this.timerText = this.add.text(
      this.scale.width - 20, 20,
      `Time: ${GAME_DURATION}`,
      { fontSize: "20px", color: "#ffffff" }
    ).setOrigin(1, 0);

    // ── Instruction hint (top-left) ────────────────────────
    this.add.text(20, 20, "Click the circles!", {
      fontSize: "16px", color: "#aaaaaa",
    });

    // ── ENTER key ─────────────────────────────────────────
    this.enterKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    // ── Countdown timer ───────────────────────────────────
    // Fires every 1000 ms, exactly GAME_DURATION times.
    this.time.addEvent({
      delay:    1000,
      repeat:   GAME_DURATION - 1, // fires GAME_DURATION times total
      callback: this.onTick,
      callbackScope: this,
    });

    // ── Spawn the first circle ────────────────────────────
    this.spawnCircle();

    // ── Fade in ───────────────────────────────────────────
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ----------------------------------------------------------
  // onTick
  // Called every second by the repeating timer event.
  // ----------------------------------------------------------
  private onTick(): void {
    this.timeLeft -= 1;
    this.timerText.setText(`Time: ${this.timeLeft}`);

    // Turn timer red in the last 5 seconds
    if (this.timeLeft <= 5) {
      this.timerText.setColor("#ff4444");
    }

    // When the clock hits zero, end the game
    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }

  // ----------------------------------------------------------
  // spawnCircle
  // Places a new random circle anywhere in the safe play area.
  // ----------------------------------------------------------
  private spawnCircle(): void {
    if (this.gameOver) return;

    const { width, height } = this.scale;

    // Random radius
    const r = Phaser.Math.Between(CIRCLE_MIN_R, CIRCLE_MAX_R);

    // Random position — kept away from edges and the HUD bar
    const x = Phaser.Math.Between(SAFE_MARGIN + r, width  - SAFE_MARGIN - r);
    const y = Phaser.Math.Between(SAFE_TOP    + r, height - SAFE_MARGIN - r);

    // Random colour from the palette
    const color = Phaser.Utils.Array.GetRandom(CIRCLE_COLORS) as number;

    // Draw the circle using Phaser's Arc game object
    this.circle = this.add.circle(x, y, r, color);
    this.circle.setStrokeStyle(3, 0xffffff, 0.5); // white outline

    // Make it clickable
    // The hit area must be explicitly set to a Circle for round shapes.
    this.circle.setInteractive(
      new Phaser.Geom.Circle(r, r, r),
      Phaser.Geom.Circle.Contains
    );

    // Register the click handler
    this.circle.once("pointerdown", () => this.onCircleClicked());
  }

  // ----------------------------------------------------------
  // onCircleClicked
  // Called when the player clicks the current circle.
  // ----------------------------------------------------------
  private onCircleClicked(): void {
    if (this.gameOver) return;

    // Remove the old circle
    this.circle?.destroy();
    this.circle = null;

    // Award point
    this.score += 1;
    this.scoreText.setText(`Score: ${this.score}`);

    // Spawn a new one immediately
    this.spawnCircle();
  }

  // ----------------------------------------------------------
  // endGame
  // Stops spawning, removes the current circle, shows result.
  // ----------------------------------------------------------
  private endGame(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    // Remove the circle that was on screen
    this.circle?.destroy();
    this.circle = null;

    // Decide pass / fail
    const passed = this.score >= WIN_SCORE;

    this.showResultScreen(passed);
  }

  // ----------------------------------------------------------
  // showResultScreen
  // Transitions to ResultScene with the minigame result.
  //
  // passed – true if the player scored enough to win
  // ----------------------------------------------------------
  private showResultScreen(passed: boolean): void {
    // Calculate accuracy (successful clicks / total time)
    const accuracy = Math.round((this.score / GAME_DURATION) * 100);
    
    // Calculate rank based on score
    let rank = "D";
    if (this.score >= 18) rank = "S";
    else if (this.score >= WIN_SCORE) rank = "A";
    else if (this.score >= 12) rank = "B";
    else if (this.score >= 8) rank = "C";

    // Build MinigameResult object
    const result = {
      score: this.score,
      accuracy: Math.min(accuracy, 100),
      rank: rank,
      // Store quest data so ResultScene can pass it back
      questId: "q1_click",
      passed: passed
    };

    // Fade out and go to ResultScene
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("ResultScene", result);
    });
  }

  // ----------------------------------------------------------
  // update – runs every frame
  // Nothing needed here — all logic is event-driven.
  // ----------------------------------------------------------
  update(): void { /* intentionally empty */ }
}
