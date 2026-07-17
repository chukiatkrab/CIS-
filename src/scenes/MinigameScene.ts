// ============================================================
// scenes/MinigameScene.ts
//
// Transition / splash screen shown before any minigame starts.
//
// Responsibilities:
//   - Receive a MinigameConfig from CampusScene
//   - Fade in and display the minigame title + instructions
//   - After a short countdown, fade out and launch the real
//     minigame scene identified by config.sceneKey
//
// This scene is completely generic.
// It never contains game-specific logic.
// ============================================================

import Phaser from "phaser";
import { MinigameConfig } from "../types/minigame";

// How long (ms) to show the splash before auto-launching
const SPLASH_DURATION = 2000;

export class MinigameScene extends Phaser.Scene {
  private config!: MinigameConfig;

  constructor() {
    super("MinigameScene");
  }

  // ----------------------------------------------------------
  // init – receives the MinigameConfig passed by CampusScene
  // ----------------------------------------------------------
  init(data: MinigameConfig): void {
    this.config = data;
  }

  // ----------------------------------------------------------
  // create
  // ----------------------------------------------------------
  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#0d0d1a");

    // Game title
    this.add
      .text(width / 2, height * 0.35, this.config.title, {
        fontSize: "42px",
        color: "#f5c518",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Instruction line
    this.add
      .text(width / 2, height * 0.52, this.config.instructions, {
        fontSize: "22px",
        color: "#cccccc",
      })
      .setOrigin(0.5);

    // "Get Ready" hint
    this.add
      .text(width / 2, height * 0.65, "Get Ready!", {
        fontSize: "18px",
        color: "#888888",
      })
      .setOrigin(0.5);

    // Fade in, then wait SPLASH_DURATION, then launch the real scene
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.time.delayedCall(SPLASH_DURATION, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        // Launch whatever scene is named in the config
        this.scene.start(this.config.sceneKey);
      });
    });
  }
}
