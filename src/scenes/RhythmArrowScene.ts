// ============================================================
// scenes/RhythmArrowScene.ts
//
// Minigame 2 – "Rhythm Arrow"  (inspired by Audition Online)
//
// ── HOW THE GAME WORKS ───────────────────────────────────────
//
//  Each ROUND:
//    1. A random arrow sequence is generated.
//    2. The sequence is displayed in the centre of the screen.
//    3. A countdown bar shows how much time is left for the
//       CURRENT arrow.
//    4. The player presses the matching arrow key.
//       • Correct → next arrow lights up, score goes up.
//       • Wrong   → sequence flashes red, round fails.
//       • Timeout → round fails.
//    5. Complete all arrows in the sequence → round passes.
//
//  Win condition: pass ROUNDS_TO_WIN rounds.
//  Lose condition: fail the same round twice in a row.
//
// ── HOW DIFFICULTY INCREASES ─────────────────────────────────
//  Round 1–2 → 4 arrows, 1.2 s per key
//  Round 3–4 → 6 arrows, 1.0 s per key
//  Round 5+  → 8 arrows, 0.8 s per key
//  (See ArrowSequenceGenerator.ts)
//
// ── HOW THE RESULT IS RETURNED ───────────────────────────────
//  scene.start("CampusScene", { minigame2Completed: true/false })
//  CampusScene.init() reads that value and updates the quest.
// ============================================================

import Phaser from "phaser";
import {
  ArrowDir,
  ARROW_KEYCODES,
  generateSequence,
  getSettingsForRound,
} from "../minigames/ArrowSequenceGenerator";
import { ArrowDisplay } from "../minigames/ArrowDisplay";

// ── Game parameters ──────────────────────────────────────────
const ROUNDS_TO_WIN   = 3;   // player must pass this many rounds
const MAX_FAILS       = 2;   // fails allowed before game over
const SCORE_CORRECT   = 10;  // points per correct key
const SCORE_WRONG     = -5;  // points deducted for wrong key

export class RhythmArrowScene extends Phaser.Scene {

  // ── Progress tracking ────────────────────────────────────
  private roundNumber  = 1;   // current round (1-indexed)
  private roundsPassed = 0;   // how many rounds completed successfully
  private failCount    = 0;   // wrong / timeout fails
  private score        = 0;   // total score across all rounds

  // ── Round state ──────────────────────────────────────────
  private sequence:     ArrowDir[] = []; // arrows for this round
  private inputIndex    = 0;            // which arrow the player must press next
  private roundActive   = false;        // false during intros/results
  private keyTimer!:    Phaser.Time.TimerEvent; // per-key countdown

  // ── Display objects ──────────────────────────────────────
  private arrowDisplay: ArrowDisplay | null = null;
  private scoreText!:   Phaser.GameObjects.Text;
  private roundText!:   Phaser.GameObjects.Text;
  private statusText!:  Phaser.GameObjects.Text; // "Round 1", "CORRECT!", etc.
  private timerBar!:    Phaser.GameObjects.Rectangle; // shrinking time bar
  private timerBg!:     Phaser.GameObjects.Rectangle; // grey background for bar

  // ── Keyboard keys ────────────────────────────────────────
  private keys!: Record<ArrowDir, Phaser.Input.Keyboard.Key>;

  // ── Canvas centre (used many times) ──────────────────────
  private cx!: number;
  private cy!: number;

  constructor() { super("RhythmArrowScene"); }

  // ----------------------------------------------------------
  // create
  // ----------------------------------------------------------
  create(): void {
    // Reset everything so the scene is clean if replayed
    this.roundNumber  = 1;
    this.roundsPassed = 0;
    this.failCount    = 0;
    this.score        = 0;
    this.inputIndex   = 0;
    this.roundActive  = false;
    this.arrowDisplay = null;

    const { width, height } = this.scale;
    this.cx = width  / 2;
    this.cy = height / 2;

    // ── Background ──────────────────────────────────────────
    this.cameras.main.setBackgroundColor("#0d0d1e");

    // ── Top bar: score (left) and round (right) ─────────────
    this.scoreText = this.add.text(20, 18, "Score: 0", {
      fontSize: "20px", color: "#ffffff",
    });

    this.roundText = this.add.text(width - 20, 18,
      `Round: ${this.roundNumber} / ${ROUNDS_TO_WIN}`, {
      fontSize: "20px", color: "#ffffff",
    }).setOrigin(1, 0);

    // ── Status text (centre, used for round announcement etc.) ─
    this.statusText = this.add.text(this.cx, this.cy - 120, "", {
      fontSize: "28px",
      color: "#f5c518",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Per-key countdown bar ───────────────────────────────
    // A horizontal bar that shrinks left-to-right as time runs out.
    const barW = 400;
    const barH = 14;
    const barY = this.cy + 80; // below the arrow display

    // Grey background track
    this.timerBg = this.add.rectangle(this.cx, barY, barW, barH, 0x333333);

    // Green fill (gets shorter each frame in update())
    this.timerBar = this.add.rectangle(
      this.cx - barW / 2, barY,  // anchored to the LEFT edge
      barW, barH,
      0x44cc44
    ).setOrigin(0, 0.5); // origin left-centre so it shrinks from right

    // ── Instruction label ───────────────────────────────────
    this.add.text(this.cx, height - 30,
      "Press the arrow keys shown!",
      { fontSize: "15px", color: "#888888" }
    ).setOrigin(0.5, 1);

    // ── Register arrow keys ─────────────────────────────────
    this.keys = {
      UP:    this.input.keyboard!.addKey(ARROW_KEYCODES.UP),
      DOWN:  this.input.keyboard!.addKey(ARROW_KEYCODES.DOWN),
      LEFT:  this.input.keyboard!.addKey(ARROW_KEYCODES.LEFT),
      RIGHT: this.input.keyboard!.addKey(ARROW_KEYCODES.RIGHT),
    };

    // ── Fade in, then start round 1 ─────────────────────────
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.startRound();
  }

  // ----------------------------------------------------------
  // startRound
  //
  // Announces the round number for 1.5 s, then begins input.
  // ----------------------------------------------------------
  private startRound(): void {
    this.roundActive = false;

    // Destroy previous arrow display if it exists
    this.arrowDisplay?.destroy();
    this.arrowDisplay = null;

    // Update round label
    this.roundText.setText(`Round: ${this.roundNumber} / ${ROUNDS_TO_WIN}`);

    // Show "Round N" announcement briefly
    this.statusText.setText(`Round  ${this.roundNumber}`).setColor("#f5c518");

    // Hide the timer bar during the announcement
    this.timerBar.setVisible(false);
    this.timerBg.setVisible(false);

    // After 1.5 s, generate sequence and start input phase
    this.time.delayedCall(1500, () => {
      this.statusText.setText(""); // clear announcement

      // Get difficulty settings for this round
      const settings = getSettingsForRound(this.roundNumber);
      this.sequence  = generateSequence(settings.arrowCount);
      this.inputIndex = 0;

      // Draw the arrows in the centre of the screen
      this.arrowDisplay = new ArrowDisplay(
        this, this.cx, this.cy, this.sequence
      );

      // Show the timer bar
      this.timerBar.setVisible(true);
      this.timerBg.setVisible(true);

      // Start the countdown for the first key
      this.roundActive = true;
      this.startKeyTimer(settings.timePerKey);
    });
  }

  // ----------------------------------------------------------
  // startKeyTimer
  //
  // Starts (or restarts) the countdown for the current key.
  // If the timer expires the player failed this key.
  //
  // timeMs – milliseconds allowed for this key press
  // ----------------------------------------------------------
  private startKeyTimer(timeMs: number): void {
    // Cancel any previous timer
    if (this.keyTimer) this.keyTimer.remove(false);

    // Reset the bar to full width
    const barW = 400;
    this.timerBar.setFillStyle(0x44cc44); // green
    this.timerBar.width = barW;

    // Store start time so update() can animate the bar
    this._keyTimerStart   = this.time.now;
    this._keyTimerDuration = timeMs;

    // Fire once when time runs out
    this.keyTimer = this.time.delayedCall(timeMs, () => {
      this.onKeyTimeout();
    });
  }

  // These fields support the timer bar animation in update()
  private _keyTimerStart    = 0;
  private _keyTimerDuration = 1200;

  // ----------------------------------------------------------
  // onKeyTimeout
  // Called when the player did not press any key in time.
  // ----------------------------------------------------------
  private onKeyTimeout(): void {
    if (!this.roundActive) return;
    this.arrowDisplay?.flashWrong(this.inputIndex);
    this.failRound("TOO SLOW!");
  }

  // ----------------------------------------------------------
  // onCorrectKey
  // Called when the player pressed the right arrow key.
  // ----------------------------------------------------------
  private onCorrectKey(): void {
    this.score += SCORE_CORRECT;
    this.scoreText.setText(`Score: ${this.score}`);

    this.inputIndex += 1;
    this.arrowDisplay?.highlightCurrent(this.inputIndex);

    // Check if the full sequence is done
    if (this.inputIndex >= this.sequence.length) {
      this.passRound();
      return;
    }

    // Start timer for the next key
    const settings = getSettingsForRound(this.roundNumber);
    this.startKeyTimer(settings.timePerKey);
  }

  // ----------------------------------------------------------
  // onWrongKey
  // Called when the player pressed the wrong arrow key.
  // ----------------------------------------------------------
  private onWrongKey(): void {
    this.score = Math.max(0, this.score + SCORE_WRONG);
    this.scoreText.setText(`Score: ${this.score}`);
    this.arrowDisplay?.flashWrong(this.inputIndex);

    // Stop the key timer immediately
    if (this.keyTimer) this.keyTimer.remove(false);
    this.failRound("WRONG KEY!");
  }

  // ----------------------------------------------------------
  // passRound
  // Player completed the sequence correctly.
  // ----------------------------------------------------------
  private passRound(): void {
    this.roundActive = false;
    if (this.keyTimer) this.keyTimer.remove(false);

    this.roundsPassed += 1;
    this.statusText.setText("PERFECT!").setColor("#44ff88");

    // Check win condition
    if (this.roundsPassed >= ROUNDS_TO_WIN) {
      this.time.delayedCall(1000, () => this.endGame(true));
      return;
    }

    // Advance to next round after 1 s
    this.roundNumber += 1;
    this.time.delayedCall(1000, () => this.startRound());
  }

  // ----------------------------------------------------------
  // failRound
  // Player made a mistake or timed out.
  // ----------------------------------------------------------
  private failRound(reason: string): void {
    this.roundActive = false;

    this.failCount += 1;
    this.statusText.setText(reason).setColor("#ff4444");

    // If too many failures → game over
    if (this.failCount >= MAX_FAILS) {
      this.time.delayedCall(1000, () => this.endGame(false));
      return;
    }

    // Otherwise retry the same round after 1.5 s
    this.time.delayedCall(1500, () => this.startRound());
  }

  // ----------------------------------------------------------
  // endGame
  // Transitions to ResultScene with the minigame result.
  //
  // won – true if the player passed enough rounds
  // ----------------------------------------------------------
  private endGame(won: boolean): void {
    this.roundActive = false;
    this.arrowDisplay?.destroy();
    this.arrowDisplay = null;
    this.timerBar.setVisible(false);
    this.timerBg.setVisible(false);

    // Calculate accuracy based on rounds passed
    const accuracy = Math.round((this.roundsPassed / ROUNDS_TO_WIN) * 100);

    // Calculate rank based on score and rounds
    let rank = "D";
    if (this.roundsPassed >= ROUNDS_TO_WIN && this.score >= 80) rank = "S";
    else if (this.roundsPassed >= ROUNDS_TO_WIN) rank = "A";
    else if (this.roundsPassed >= 2) rank = "B";
    else if (this.roundsPassed >= 1) rank = "C";

    // Build MinigameResult object
    const result = {
      score: this.score,
      accuracy: accuracy,
      rank: rank,
      // Store quest data so ResultScene can pass it back
      questId: "q2_rhythm",
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
  // Reads arrow keys and animates the countdown bar.
  // ----------------------------------------------------------
  update(): void {
    if (!this.roundActive) return;

    // ── Animate the timer bar ────────────────────────────────
    // Calculate how much time has elapsed since the key timer started.
    const elapsed  = this.time.now - this._keyTimerStart;
    const fraction = 1 - Math.min(elapsed / this._keyTimerDuration, 1);
    const barW     = 400;
    this.timerBar.width = barW * fraction;

    // Colour shifts green → yellow → red as time runs out
    if (fraction > 0.5) {
      this.timerBar.setFillStyle(0x44cc44); // green
    } else if (fraction > 0.25) {
      this.timerBar.setFillStyle(0xffcc00); // yellow
    } else {
      this.timerBar.setFillStyle(0xff4444); // red
    }

    // ── Read arrow key input ─────────────────────────────────
    // JustDown fires only on the first frame the key is pressed,
    // preventing the player from holding a key down.
    const dirs: ArrowDir[] = ["UP", "DOWN", "LEFT", "RIGHT"];

    for (const dir of dirs) {
      if (Phaser.Input.Keyboard.JustDown(this.keys[dir])) {
        // Is this the key the player should press?
        const expected = this.sequence[this.inputIndex];
        if (dir === expected) {
          this.onCorrectKey();
        } else {
          this.onWrongKey();
        }
        return; // only process one key per frame
      }
    }
  }
}
