// ============================================================
// ui/PauseMenu.ts
//
// Pause overlay — shown when the player presses ESC.
//
// Uses the two-camera UI system (see CampusScene).
// All objects are placed on a Layer that:
//   • the main world camera ignores
//   • the uiCamera (zoom=1) renders at correct screen coordinates
// ============================================================

import Phaser from "phaser";

export class PauseMenu {
  private scene:        Phaser.Scene;
  private layer:        Phaser.GameObjects.Layer;
  private paused        = false;
  private onBackToMenu: () => void;

  constructor(scene: Phaser.Scene, onBackToMenu: () => void) {
    this.scene        = scene;
    this.onBackToMenu = onBackToMenu;

    // Logical canvas dimensions (always 960×640)
    const sw = scene.scale.width;
    const sh = scene.scale.height;

    // Layer depth 105 — above dialogue (100) and HUD (90)
    this.layer = scene.add.layer();
    this.layer.setDepth(105);
    this.layer.setVisible(false); // hidden until show() is called

    // World camera must not render UI layers
    scene.cameras.main.ignore(this.layer);

    // Full-screen dim overlay
    const overlay = scene.add.rectangle(
      sw / 2, sh / 2, sw, sh, 0x000000, 0.65
    );
    this.layer.add(overlay);

    // "PAUSED" title
    const title = scene.add.text(sw / 2, sh * 0.35, "PAUSED", {
      fontSize: "40px", color: "#f5c518", fontStyle: "bold",
    }).setOrigin(0.5);
    this.layer.add(title);

    // RESUME button
    this.layer.add(
      this.makeButton(scene, sw / 2, sh * 0.52, "RESUME", () => this.hide())
    );

    // BACK TO MENU button
    this.layer.add(
      this.makeButton(scene, sw / 2, sh * 0.65, "Back to Menu", () => this.onBackToMenu())
    );
  }

  toggle(): void { this.paused ? this.hide() : this.show(); }

  show(): void {
    this.paused = true;
    this.layer.setVisible(true);
    this.scene.physics.pause();
  }

  hide(): void {
    this.paused = false;
    this.layer.setVisible(false);
    this.scene.physics.resume();
  }

  isPaused(): boolean { return this.paused; }

  private makeButton(
    scene: Phaser.Scene,
    x: number, y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const btn = scene.add.text(x, y, label, {
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#333366",
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerover", () =>
      btn.setStyle({ color: "#f5c518", backgroundColor: "#555588" }));
    btn.on("pointerout", () =>
      btn.setStyle({ color: "#ffffff", backgroundColor: "#333366" }));
    btn.on("pointerdown", onClick);

    return btn;
  }
}
