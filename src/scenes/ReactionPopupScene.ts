// ============================================================
// scenes/ReactionPopupScene.ts
//
// Minigame 3 – "Reaction Popup"
//
// ── HOW IT WORKS ─────────────────────────────────────────────
//
//  Each of 10 ROUNDS:
//    1. A popup card slides in from the LEFT or RIGHT side.
//       The card shows a large arrow (← or →).
//    2. The player must press the MATCHING arrow key before
//       the timer runs out.
//       • Correct key in time  → +10 score, green flash
//       • Wrong key            → red flash, round counted as fail
//       • No key (timeout)     → red flash, round counted as fail
//    3. After a brief result flash the next round starts.
//
//  Win condition: score ≥ 7 correct out of 10 rounds.
//
// ── DIFFICULTY ───────────────────────────────────────────────
//  Rounds 1–3  →  2000 ms reaction window
//  Rounds 4–7  →  1500 ms reaction window
//  Rounds 8–10 →  1000 ms reaction window
//
// ── RETURN VALUE ─────────────────────────────────────────────
//  scene.start("CampusScene", { minigame3Completed: boolean })
//  CampusScene.init() reads this to update the third NPC/quest.
// ============================================================

import Phaser from "phaser";

// ── Constants ────────────────────────────────────────────────
const TOTAL_ROUNDS  = 10;
const WIN_THRESHOLD = 7;   // correct answers needed to win

// Reaction window in ms per difficulty band
const TIME_EASY   = 2000; // rounds 1-3
const TIME_MEDIUM = 1500; // rounds 4-7
const TIME_HARD   = 1000; // rounds 8-10

// Direction type for this minigame (only LEFT / RIGHT)
type PopupDir = "LEFT" | "RIGHT";

// Visual constants
const CARD_W = 200;  // popup card width  (px)
const CARD_H = 160;  // popup card height (px)
const BAR_W  = 400;  // countdown bar width (px)
const BAR_H  = 16;   // countdown bar height (px)

export class ReactionPopupScene extends Phaser.Scene {

  // ── Progress ──────────────────────────────────────────────
  private currentRound = 0;   // 1-indexed, incremented before each round
  private correctCount = 0;   // how many rounds answered correctly
  private score        = 0;   // running total score

  // ── Round state ───────────────────────────────────────────
  private roundActive = false;      // true while waiting for a key press
  private currentDir: PopupDir = "LEFT"; // direction shown this round
  private roundTimer!: Phaser.Time.TimerEvent; // fires on timeout

  // ── Popup card visuals ────────────────────────────────────
  private cardBg!:   Phaser.GameObjects.Rectangle; // coloured card background
  private cardArrow!: Phaser.GameObjects.Text;      // large arrow symbol
  private cardBorder!: Phaser.GameObjects.Rectangle; // thin border

  // ── HUD text ─────────────────────────────────────────────
  private roundText!:  Phaser.GameObjects.Text;
  private scoreText!:  Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text; // "CORRECT!" / "WRONG!" etc.

  // ── Countdown bar ────────────────────────────────────────
  private timerBg!:  Phaser.GameObjects.Rectangle;
  private timerBar!: Phaser.GameObjects.Rectangle;

  // ── Fields used to animate the timer bar in update() ─────
  private _timerStart    = 0;
  private _timerDuration = TIME_EASY;

  // ── Arrow keys ────────────────────────────────────────────
  private keyLeft!:  Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;

  constructor() { super("ReactionPopupScene"); }

  // ----------------------------------------------------------
  // create
  // ----------------------------------------------------------
  create(): void {
    // Reset all state (important if the scene is replayed)
    this.currentRound = 0;
    this.correctCount = 0;
    this.score        = 0;
    this.roundActive  = false;

    const { width, height } = this.scale;
    const cx = width  / 2;
    const cy = height / 2;

    // ── Background ──────────────────────────────────────────
    this.cameras.main.setBackgroundColor("#0e0e20");

    // ── HUD: round counter (top-left) ───────────────────────
    this.roundText = this.add.text(20, 18,
      `Round: 1 / ${TOTAL_ROUNDS}`,
      { fontSize: "20px", color: "#ffffff" }
    );

    // ── HUD: score (top-right) ───────────────────────────────
    this.scoreText = this.add.text(width - 20, 18,
      "Score: 0",
      { fontSize: "20px", color: "#ffffff" }
    ).setOrigin(1, 0);

    // ── Status text (centre, used for feedback messages) ─────
    this.statusText = this.add.text(cx, cy - 140, "", {
      fontSize: "30px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Popup card (starts hidden, shown each round) ──────────
    // Border (slightly larger, drawn below the bg)
    this.cardBorder = this.add.rectangle(cx, cy, CARD_W + 6, CARD_H + 6, 0xffffff, 1)
      .setVisible(false);

    // Main card background
    this.cardBg = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0x1a1a3a, 1)
      .setVisible(false);

    // Arrow symbol inside the card
    this.cardArrow = this.add.text(cx, cy, "", {
      fontSize: "90px",
      color: "#ffffff",
    }).setOrigin(0.5).setVisible(false);

    // ── Countdown bar (below the card) ───────────────────────
    const barY = cy + CARD_H / 2 + 30;

    this.timerBg = this.add.rectangle(cx, barY, BAR_W, BAR_H, 0x333333)
      .setVisible(false);

    // Bar is anchored on the LEFT so it shrinks from right to left
    this.timerBar = this.add.rectangle(
      cx - BAR_W / 2, barY,
      BAR_W, BAR_H,
      0x44cc44
    ).setOrigin(0, 0.5).setVisible(false);

    // ── Instruction text (bottom) ────────────────────────────
    this.add.text(cx, height - 30,
      "Press  ←  or  →  to match the arrow!",
      { fontSize: "16px", color: "#888888" }
    ).setOrigin(0.5, 1);

    // ── Register LEFT / RIGHT arrow keys ─────────────────────
    this.keyLeft  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    // ── Fade in then begin ───────────────────────────────────
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Brief pause before round 1 so the fade finishes
    this.time.delayedCall(600, () => this.startNextRound());
  }

  // ----------------------------------------------------------
  // getTimeForRound
  //
  // Returns the reaction window in ms for the given round.
  // Higher round number = less time.
  // ----------------------------------------------------------
  private getTimeForRound(round: number): number {
    if (round <= 3) return TIME_EASY;
    if (round <= 7) return TIME_MEDIUM;
    return TIME_HARD;
  }

  // ----------------------------------------------------------
  // startNextRound
  //
  // Increments the round counter and shows the popup card.
  // ----------------------------------------------------------
  private startNextRound(): void {
    this.currentRound += 1;

    // If all rounds are done, end the game
    if (this.currentRound > TOTAL_ROUNDS) {
      this.endGame();
      return;
    }

    // Update round label
    this.roundText.setText(`Round: ${this.currentRound} / ${TOTAL_ROUNDS}`);

    // Clear status message from previous round
    this.statusText.setText("");

    // Randomly pick LEFT or RIGHT
    this.currentDir = Math.random() < 0.5 ? "LEFT" : "RIGHT";

    // Show the popup card
    this.showCard(this.currentDir);

    // Start the reaction timer
    const timeMs = this.getTimeForRound(this.currentRound);
    this.startReactionTimer(timeMs);
  }

  // ----------------------------------------------------------
  // showCard
  //
  // Positions and reveals the popup card.
  // The card slides from the matching side so the player gets
  // a visual cue about which direction to press.
  //
  // dir – "LEFT" or "RIGHT"
  // ----------------------------------------------------------
  private showCard(dir: PopupDir): void {
    const { width, height } = this.scale;
    const cx = width  / 2;
    const cy = height / 2;

    // Card colour: blue for LEFT, orange for RIGHT
    const color  = dir === "LEFT" ? 0x1144aa : 0xaa4411;
    const symbol = dir === "LEFT" ? "←"      : "→";

    // Position on the appropriate side of centre
    const cardX = dir === "LEFT"
      ? cx - 180   // left of centre
      : cx + 180;  // right of centre

    // Update card objects
    this.cardBorder.setPosition(cardX, cy).setVisible(true);
    this.cardBg.setPosition(cardX, cy).setFillStyle(color, 1).setVisible(true);
    this.cardArrow.setPosition(cardX, cy).setText(symbol).setVisible(true);

    // Show and reset the timer bar
    this.timerBg.setVisible(true);
    this.timerBar.setVisible(true);
    this.timerBar.setFillStyle(0x44cc44);
    this.timerBar.width = BAR_W;
  }

  // ----------------------------------------------------------
  // hideCard
  // Hides the popup card and timer bar.
  // ----------------------------------------------------------
  private hideCard(): void {
    this.cardBorder.setVisible(false);
    this.cardBg.setVisible(false);
    this.cardArrow.setVisible(false);
    this.timerBg.setVisible(false);
    this.timerBar.setVisible(false);
  }

  // ----------------------------------------------------------
  // startReactionTimer
  //
  // Begins the countdown for this round.
  // If it fires, the player was too slow.
  //
  // timeMs – reaction window in milliseconds
  // ----------------------------------------------------------
  private startReactionTimer(timeMs: number): void {
    this._timerStart    = this.time.now;
    this._timerDuration = timeMs;
    this.roundActive    = true;

    // Cancel any leftover timer from a previous round
    if (this.roundTimer) this.roundTimer.remove(false);

    this.roundTimer = this.time.delayedCall(timeMs, () => {
      this.onTimeout();
    });
  }

  // ----------------------------------------------------------
  // onTimeout
  // Player did not press any key in time.
  // ----------------------------------------------------------
  private onTimeout(): void {
    if (!this.roundActive) return;
    this.roundActive = false;
    this.resolveRound(false, "TOO SLOW!");
  }

  // ----------------------------------------------------------
  // onCorrect
  // Player pressed the right key.
  // ----------------------------------------------------------
  private onCorrect(): void {
    this.roundActive = false;
    if (this.roundTimer) this.roundTimer.remove(false);

    this.correctCount += 1;
    this.score        += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    this.resolveRound(true, "CORRECT!");
  }

  // ----------------------------------------------------------
  // onWrong
  // Player pressed the wrong key.
  // ----------------------------------------------------------
  private onWrong(): void {
    this.roundActive = false;
    if (this.roundTimer) this.roundTimer.remove(false);

    this.resolveRound(false, "WRONG!");
  }

  // ----------------------------------------------------------
  // resolveRound
  //
  // Hides the card, shows a result flash, then starts the
  // next round after a short delay.
  //
  // success – true if the player answered correctly
  // message – short text to display ("CORRECT!", "WRONG!", etc.)
  // ----------------------------------------------------------
  private resolveRound(success: boolean, message: string): void {
    this.hideCard();

    const color = success ? "#44ff88" : "#ff4444";
    this.statusText.setText(message).setColor(color);

    // Pause briefly so the player can read the feedback,
    // then move to the next round
    this.time.delayedCall(700, () => this.startNextRound());
  }

  // ----------------------------------------------------------
  // endGame
  //
  // All rounds complete – transition to ResultScene.
  // ----------------------------------------------------------
  private endGame(): void {
    this.roundActive = false;
    this.statusText.setText("");

    const won = this.correctCount >= WIN_THRESHOLD;

    // Calculate accuracy
    const accuracy = Math.round((this.correctCount / TOTAL_ROUNDS) * 100);

    // Calculate rank based on correct count
    let rank = "D";
    if (this.correctCount >= 9) rank = "S";
    else if (this.correctCount >= WIN_THRESHOLD) rank = "A";
    else if (this.correctCount >= 5) rank = "B";
    else if (this.correctCount >= 3) rank = "C";

    // Build MinigameResult object
    const result = {
      score: this.score,
      accuracy: accuracy,
      rank: rank,
      // Store quest data so ResultScene can pass it back
      questId: "q3_reaction",
      passed: won
    };

    // Fade out and go to ResultScene
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("ResultScene", result);
    });
  }

  // ----------------------------------------------------------
  // update – runs every frame
  //
  // Reads left/right keys and animates the countdown bar.
  // ----------------------------------------------------------
  update(): void {
    if (!this.roundActive) return;

    // ── Animate countdown bar ────────────────────────────────
    const elapsed  = this.time.now - this._timerStart;
    const fraction = 1 - Math.min(elapsed / this._timerDuration, 1);
    this.timerBar.width = BAR_W * fraction;

    // Colour shifts green → yellow → red
    if (fraction > 0.5) {
      this.timerBar.setFillStyle(0x44cc44); // green
    } else if (fraction > 0.25) {
      this.timerBar.setFillStyle(0xffcc00); // yellow
    } else {
      this.timerBar.setFillStyle(0xff4444); // red
    }

    // ── Read LEFT / RIGHT key input ──────────────────────────
    // JustDown fires once per key-press (not every frame while held)
    const pressedLeft  = Phaser.Input.Keyboard.JustDown(this.keyLeft);
    const pressedRight = Phaser.Input.Keyboard.JustDown(this.keyRight);

    if (!pressedLeft && !pressedRight) return; // no key this frame

    // Determine if the pressed key matches the displayed arrow
    const correct =
      (pressedLeft  && this.currentDir === "LEFT") ||
      (pressedRight && this.currentDir === "RIGHT");

    if (correct) {
      this.onCorrect();
    } else {
      this.onWrong();
    }
  }
}
