// ============================================================
// ui/HUD.ts
//
// Heads-Up Display: Mission, Score, Time — always in the
// top-left corner of the screen.
//
// Uses the two-camera UI system (see CampusScene).
// Objects are placed on a Layer that:
//   • the main world camera ignores  (no zoom/scroll interference)
//   • the uiCamera (zoom=1) renders  (correct screen coordinates)
//
// Because the logical canvas is fixed at 960×640, x=16 always
// means "16 pixels from the left edge of the screen", even when
// the browser window is resized.
// ============================================================

import Phaser from "phaser";

export class HUD {
  private missionText: Phaser.GameObjects.Text;
  private scoreText:   Phaser.GameObjects.Text;
  private timeText:    Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    // Create a UI Layer — depth 90 puts it above world objects
    // but below the dialogue box (100) and pause menu (105).
    const layer = scene.add.layer();
    layer.setDepth(90);

    // The main (world) camera must not render UI layers.
    scene.cameras.main.ignore(layer);

    const x     = 16;  // left margin in logical pixels
    const lineH = 26;  // vertical spacing between labels

    // Background panel
    const panelW = 210;
    const panelH = 88;
    const panel  = scene.add.rectangle(
      x + panelW / 2, 8 + panelH / 2,
      panelW, panelH,
      0x000000, 0.5
    );
    layer.add(panel);

    // Labels
    this.missionText = scene.add.text(
      x + 8, 14, "Mission : None", { fontSize: "14px", color: "#ffffff" }
    );
    layer.add(this.missionText);

    this.scoreText = scene.add.text(
      x + 8, 14 + lineH, "Score : 0", { fontSize: "14px", color: "#ffffff" }
    );
    layer.add(this.scoreText);

    this.timeText = scene.add.text(
      x + 8, 14 + lineH * 2, "Time : Morning", { fontSize: "14px", color: "#ffffff" }
    );
    layer.add(this.timeText);
  }

  updateMission(mission: string): void { this.missionText.setText(`Mission : ${mission}`); }
  updateScore(score: number):    void { this.scoreText.setText(`Score : ${score}`); }
  updateTime(time: string):      void { this.timeText.setText(`Time : ${time}`); }
}
