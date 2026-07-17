// ============================================================
// scenes/ResultScene.ts
//
// Displays the result of a finished minigame.
//
// Responsibilities:
//   - Receive a MinigameResult from MinigameScene
//   - Show Score, Accuracy, and Rank
//   - Wait for ENTER, then return to CampusScene with a fade
// ============================================================

import Phaser from "phaser";
import { MinigameResult } from "../types/minigame";

// Extended result type that may include quest data
interface ExtendedMinigameResult extends MinigameResult {
  questId?: string;
  passed?: boolean;
}

export class ResultScene extends Phaser.Scene {
  // The result data passed from MinigameScene
  private result!: ExtendedMinigameResult;

  // ENTER key reference
  private enterKey!: Phaser.Input.Keyboard.Key;

  // Prevent ENTER from firing twice
  private leaving: boolean = false;

  constructor() {
    super("ResultScene");
  }

  // ----------------------------------------------------------
  // init
  // Receives the MinigameResult data.
  // ----------------------------------------------------------
  init(data: ExtendedMinigameResult): void {
    this.result = data;
    this.leaving = false;
  }

  // ----------------------------------------------------------
  // create
  // ----------------------------------------------------------
  create(): void {
    const { width, height } = this.scale;

    // Dark background (slightly different shade for variety)
    this.cameras.main.setBackgroundColor("#0a0a18");

    // --- "RESULT" heading ---
    this.add
      .text(width / 2, height * 0.15, "RESULT", {
        fontSize: "40px",
        color: "#f5c518",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // --- Divider line (drawn as a thin rectangle) ---
    this.add.rectangle(width / 2, height * 0.24, 300, 2, 0x444466);

    // --- Score ---
    this.addResultRow(width / 2, height * 0.36, "Score", `${this.result.score}`);

    // --- Accuracy ---
    this.addResultRow(width / 2, height * 0.49, "Accuracy", `${this.result.accuracy}%`);

    // --- Rank (bigger, coloured) ---
    this.addRankDisplay(width / 2, height * 0.64, this.result.rank);

    // --- ENTER prompt (blinks to attract attention) ---
    const prompt = this.add
      .text(width / 2, height * 0.83, "Press ENTER to return", {
        fontSize: "18px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    // Simple blink: toggle alpha every 600 ms
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        prompt.setAlpha(prompt.alpha === 1 ? 0.2 : 1);
      },
    });

    // --- Register ENTER key ---
    this.enterKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ----------------------------------------------------------
  // update
  // ----------------------------------------------------------
  update(): void {
    if (this.leaving) return;

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.leaving = true;
      this.returnToCampus();
    }
  }

  // ----------------------------------------------------------
  // returnToCampus
  // Fades out and restarts CampusScene.
  // If quest data exists, pass it back to CampusScene.
  // ----------------------------------------------------------
  private returnToCampus(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      // If this result came from a quest minigame, pass the quest data back
      if (this.result.questId !== undefined && this.result.passed !== undefined) {
        this.scene.start("CampusScene", { 
          questId: this.result.questId, 
          passed: this.result.passed 
        });
      } else {
        // No quest data - just return to campus normally
        this.scene.start("CampusScene");
      }
    });
  }

  // ----------------------------------------------------------
  // addResultRow  (private helper)
  //
  // Draws a label on the left and a value on the right,
  // centred around the given x position.
  // ----------------------------------------------------------
  private addResultRow(x: number, y: number, label: string, value: string): void {
    // Label (left-aligned around centre)
    this.add
      .text(x - 20, y, label, {
        fontSize: "22px",
        color: "#aaaacc",
      })
      .setOrigin(1, 0.5); // right-align label to the centre point

    // Value (right-aligned around centre)
    this.add
      .text(x + 20, y, value, {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5); // left-align value from centre point
  }

  // ----------------------------------------------------------
  // addRankDisplay  (private helper)
  //
  // Draws the rank letter large and coloured by grade.
  // ----------------------------------------------------------
  private addRankDisplay(x: number, y: number, rank: string): void {
    // Choose a colour based on the rank letter
    const rankColor: Record<string, string> = {
      S: "#ffd700",
      A: "#44ff88",
      B: "#44aaff",
      C: "#ffaa44",
      D: "#ff4444",
    };
    const color = rankColor[rank] ?? "#ffffff";

    this.add
      .text(x - 20, y, "Rank", {
        fontSize: "22px",
        color: "#aaaacc",
      })
      .setOrigin(1, 0.5);

    this.add
      .text(x + 20, y, rank, {
        fontSize: "36px",
        color,
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
  }
}
