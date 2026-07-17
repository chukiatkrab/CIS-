// ============================================================
// scenes/ReactionRushScene.ts
//
// The actual gameplay for "Reaction Rush".
//
// Responsibilities:
//   - Run a 30-second timer
//   - Spawn one circle at a time at a random position
//   - Handle click → score + combo
//   - Auto-remove a circle after 1.2 s if missed → reset combo
//   - When time runs out → calculate result → go to ResultScene
// ============================================================

import Phaser from "phaser";
import { MinigameResult } from "../types/minigame";
import { pickRandomType, CircleType } from "../minigames/CircleType";
import { ReactionRushHUD } from "../minigames/ReactionRushHUD";

// ---- Game constants ----------------------------------------
const GAME_DURATION   = 30;   // total seconds
const CIRCLE_LIFETIME = 1200; // ms before a missed circle disappears
const CIRCLE_MIN_R    = 24;   // minimum circle radius (px)
const CIRCLE_MAX_R    = 40;   // maximum circle radius (px)

// Safe area so circles never overlap the HUD bar at the top
const SAFE_TOP    = 60;
const SAFE_BOTTOM = 20;
const SAFE_SIDE   = 50;

export class ReactionRushScene extends Phaser.Scene {
  // ---- Score tracking ----
  private score:  number = 0;
  private combo:  number = 0;
  private hits:   number = 0; // circles successfully clicked
  private misses: number = 0; // circles that expired

  // ---- Timer ----
  private timeLeft: number = GAME_DURATION; // seconds remaining
  private gameOver: boolean = false;

  // ---- Current circle on screen ----
  // We keep only ONE circle alive at a time.
  private circle:       Phaser.GameObjects.Arc | null = null;
  private circleTimer:  Phaser.Time.TimerEvent  | null = null;
  // Store which CircleType the current circle is
  private circleType:   CircleType | null = null;

  // ---- UI ----
  private hud!: ReactionRushHUD;

  constructor() {
    super("ReactionRushScene");
  }

  // ----------------------------------------------------------
  // create
  // ----------------------------------------------------------
  create(): void {
    this.cameras.main.setBackgroundColor("#111122");

    // Reset all state (important when replaying)
    this.score    = 0;
    this.combo    = 0;
    this.hits     = 0;
    this.misses   = 0;
    this.timeLeft = GAME_DURATION;
    this.gameOver = false;
    this.circle      = null;
    this.circleTimer = null;
    this.circleType  = null;

    // Build the HUD bar at the top
    this.hud = new ReactionRushHUD(this);

    // Tick the countdown once per second
    this.time.addEvent({
      delay: 1000,
      repeat: GAME_DURATION - 1, // fires GAME_DURATION times total
      callback: this.onSecondTick,
      callbackScope: this,
    });

    // Spawn the first circle
    this.spawnCircle();

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ----------------------------------------------------------
  // onSecondTick
  // Called every second by the Phaser timer.
  // ----------------------------------------------------------
  private onSecondTick(): void {
    this.timeLeft -= 1;
    this.hud.setTime(this.timeLeft);

    // When the clock hits zero, end the game
    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }

  // ----------------------------------------------------------
  // spawnCircle
  // Creates one new circle at a random position.
  // ----------------------------------------------------------
  private spawnCircle(): void {
    if (this.gameOver) return;

    const { width, height } = this.scale;

    // Pick a random type (red / blue / golden / bomb)
    const type   = pickRandomType();
    // Pick a random radius between min and max
    const radius = Phaser.Math.Between(CIRCLE_MIN_R, CIRCLE_MAX_R);

    // Random position, kept away from edges and the HUD bar
    const x = Phaser.Math.Between(SAFE_SIDE + radius, width  - SAFE_SIDE  - radius);
    const y = Phaser.Math.Between(SAFE_TOP  + radius, height - SAFE_BOTTOM - radius);

    // Draw the circle using Phaser's Arc game object
    const arc = this.add.circle(x, y, radius, type.color);

    // Add a thin white border so circles are easier to see
    arc.setStrokeStyle(3, 0xffffff, 0.6);

    // Make it interactive so we can click it
    arc.setInteractive(
      new Phaser.Geom.Circle(radius, radius, radius),
      Phaser.Geom.Circle.Contains
    );

    // When clicked, handle the hit
    arc.on("pointerdown", () => this.onCircleClicked(arc, type));

    // Store references so we can remove them later
    this.circle     = arc;
    this.circleType = type;

    // Auto-remove after CIRCLE_LIFETIME ms if not clicked
    this.circleTimer = this.time.delayedCall(
      CIRCLE_LIFETIME,
      () => this.onCircleMissed(),
    );
  }

  // ----------------------------------------------------------
  // onCircleClicked
  // Called when the player successfully clicks a circle.
  // ----------------------------------------------------------
  private onCircleClicked(
    arc: Phaser.GameObjects.Arc,
    type: CircleType
  ): void {
    // Cancel the auto-remove timer
    this.cancelCircleTimer();

    // Remove the circle from the screen
    arc.destroy();
    this.circle = null;

    if (type.isBomb) {
      // Bomb: subtract points, reset combo
      this.score = Math.max(0, this.score + type.points);
      this.combo = 0;
      this.misses += 1; // count as a miss for accuracy
    } else {
      // Normal circle: add points, increase combo
      this.score += type.points;
      this.combo += 1;
      this.hits  += 1;
    }

    // Refresh HUD
    this.hud.setScore(this.score);
    this.hud.setCombo(this.combo);

    // Spawn the next circle immediately
    this.spawnCircle();
  }

  // ----------------------------------------------------------
  // onCircleMissed
  // Called when the circle timer expires without a click.
  // ----------------------------------------------------------
  private onCircleMissed(): void {
    // Remove the expired circle
    if (this.circle) {
      this.circle.destroy();
      this.circle = null;
    }

    // Penalty: reset combo, record miss
    this.combo  = 0;
    this.misses += 1;

    this.hud.setCombo(this.combo);

    // Spawn a fresh circle immediately
    this.spawnCircle();
  }

  // ----------------------------------------------------------
  // cancelCircleTimer
  // Safely cancels the auto-remove timer if it exists.
  // ----------------------------------------------------------
  private cancelCircleTimer(): void {
    if (this.circleTimer) {
      this.circleTimer.remove(false);
      this.circleTimer = null;
    }
  }

  // ----------------------------------------------------------
  // endGame
  // Stops gameplay and transitions to ResultScene.
  // ----------------------------------------------------------
  private endGame(): void {
    if (this.gameOver) return; // guard against double calls
    this.gameOver = true;

    // Clean up the current circle and its timer
    this.cancelCircleTimer();
    if (this.circle) {
      this.circle.destroy();
      this.circle = null;
    }

    // Build the result object
    const result: MinigameResult = {
      score:    this.score,
      accuracy: this.calculateAccuracy(),
      rank:     this.calculateRank(),
    };

    // Fade out then go to ResultScene
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("ResultScene", result);
    });
  }

  // ----------------------------------------------------------
  // calculateAccuracy
  // accuracy = hits / (hits + misses) × 100
  // Returns 0 if no circles were attempted.
  // ----------------------------------------------------------
  private calculateAccuracy(): number {
    const total = this.hits + this.misses;
    if (total === 0) return 0;
    return Math.round((this.hits / total) * 100);
  }

  // ----------------------------------------------------------
  // calculateRank
  // Simple threshold system based on score.
  // ----------------------------------------------------------
  private calculateRank(): string {
    if (this.score >= 1000) return "S";
    if (this.score >= 700)  return "A";
    if (this.score >= 400)  return "B";
    if (this.score >= 200)  return "C";
    return "D";
  }
}
