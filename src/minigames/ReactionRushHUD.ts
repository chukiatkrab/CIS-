// ============================================================
// minigames/ReactionRushHUD.ts
//
// Displays TIME, SCORE, and COMBO during Reaction Rush.
//
// Responsibility: UI only.
// It never touches game logic — it only shows numbers.
// ReactionRushScene is responsible for calling the update
// methods here whenever values change.
// ============================================================

import Phaser from "phaser";

export class ReactionRushHUD {
  private timeText:  Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private comboText: Phaser.GameObjects.Text;

  // ----------------------------------------------------------
  // constructor
  // scene - the scene to add the HUD objects to
  // ----------------------------------------------------------
  constructor(scene: Phaser.Scene) {
    const { width } = scene.scale;

    // Shared text style for all three labels
    const style = { fontSize: "20px", color: "#ffffff" };

    // ---- TIME (left) ----
    this.timeText = scene.add
      .text(20, 16, "TIME  30", style)
      .setScrollFactor(0); // pin to camera

    // ---- SCORE (centre) ----
    this.scoreText = scene.add
      .text(width / 2, 16, "SCORE  0", style)
      .setOrigin(0.5, 0)
      .setScrollFactor(0);

    // ---- COMBO (right) ----
    this.comboText = scene.add
      .text(width - 20, 16, "COMBO  x0", style)
      .setOrigin(1, 0)
      .setScrollFactor(0);
  }

  // ----------------------------------------------------------
  // setTime  – updates the time display
  // seconds  – remaining seconds (integer)
  // ----------------------------------------------------------
  setTime(seconds: number): void {
    // Turn red when 5 seconds or less remain
    const color = seconds <= 5 ? "#ff4444" : "#ffffff";
    this.timeText.setText(`TIME  ${seconds}`).setColor(color);
  }

  // ----------------------------------------------------------
  // setScore  – updates the score display
  // ----------------------------------------------------------
  setScore(score: number): void {
    this.scoreText.setText(`SCORE  ${score}`);
  }

  // ----------------------------------------------------------
  // setCombo  – updates the combo display
  // ----------------------------------------------------------
  setCombo(combo: number): void {
    // Highlight combo in gold when it's 3 or higher
    const color = combo >= 3 ? "#ffd700" : "#ffffff";
    this.comboText.setText(`COMBO  x${combo}`).setColor(color);
  }
}
