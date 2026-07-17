// ============================================================
// scenes/MainMenuScene.ts
//
// The Main Menu screen.
// Shows the game title and two buttons: START and EXIT.
//
// Responsibilities:
//   - Display title text
//   - Display START button → go to CampusScene
//   - Display EXIT button → close the window
// ============================================================

import Phaser from "phaser";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create(): void {
    const { width, height } = this.scale;

    // --- Background colour ---
    this.cameras.main.setBackgroundColor("#1a1a2e");

    // --- Game Title ---
    this.add
      .text(width / 2, height * 0.25, "KKU Freshman Adventure", {
        fontSize: "36px",
        color: "#f5c518",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    // --- Subtitle ---
    this.add
      .text(width / 2, height * 0.37, "Start your university life!", {
        fontSize: "16px",
        color: "#aaaaaa",
        align: "center",
      })
      .setOrigin(0.5);

    // --- START button ---
    this.createButton(width / 2, height * 0.55, "START", () => {
      // Move to the campus gameplay scene
      this.scene.start("CampusScene");
    });

    // --- EXIT button ---
    this.createButton(width / 2, height * 0.68, "EXIT", () => {
      // Close the browser tab / window
      window.close();
    });
  }

  // ----------------------------------------------------------
  // createButton
  //
  // Creates an interactive text button at the given position.
  // Highlights on hover and calls onClick when clicked.
  //
  // x, y    - center position of the button
  // label   - text shown on the button
  // onClick - function to call when the button is clicked
  // ----------------------------------------------------------
  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): void {
    const button = this.add
      .text(x, y, label, {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: "#333366",
        padding: { x: 30, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true }); // show pointer cursor on hover

    // Highlight when mouse enters the button
    button.on("pointerover", () => {
      button.setStyle({ color: "#f5c518", backgroundColor: "#555588" });
    });

    // Reset style when mouse leaves
    button.on("pointerout", () => {
      button.setStyle({ color: "#ffffff", backgroundColor: "#333366" });
    });

    // Call the provided function when clicked
    button.on("pointerdown", onClick);
  }
}
