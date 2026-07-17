// ============================================================
// minigames/ArrowDisplay.ts
//
// Responsibility: draw the arrow sequence panel on screen.
//
// It shows a row of arrow symbols.  The "current" arrow (the
// one the player must press next) is highlighted in gold.
// Already-pressed arrows are dimmed.  Upcoming arrows are white.
//
// This class only handles DISPLAY — it never reads keyboard input.
// RhythmArrowScene owns the game logic and calls update() here
// whenever the state changes.
// ============================================================

import Phaser from "phaser";
import { ArrowDir, ARROW_SYMBOLS } from "./ArrowSequenceGenerator";

// Visual style constants
const ARROW_FONT_SIZE  = "52px";  // large so arrows are easy to read
const SPACING          = 70;      // horizontal gap between arrows (px)

// Colours for each arrow state
const COLOR_UPCOMING  = "#cccccc"; // not yet reached
const COLOR_CURRENT   = "#f5c518"; // the arrow to press RIGHT NOW (gold)
const COLOR_DONE      = "#445566"; // already pressed (dimmed)
const COLOR_WRONG     = "#ff4444"; // flashes red on wrong key press

export class ArrowDisplay {
  // The Phaser scene we draw into
  private scene: Phaser.Scene;

  // One Text object per arrow in the sequence
  private arrowTexts: Phaser.GameObjects.Text[] = [];

  // Background panel (drawn once, never changes)
  private panel: Phaser.GameObjects.Rectangle;

  // ----------------------------------------------------------
  // constructor
  //
  // scene    – the scene to add objects to
  // cx, cy   – centre position of the arrow row (canvas pixels)
  // sequence – the full arrow sequence for this round
  // ----------------------------------------------------------
  constructor(
    scene: Phaser.Scene,
    cx: number,
    cy: number,
    sequence: ArrowDir[]
  ) {
    this.scene = scene;

    // ── Background panel ────────────────────────────────────
    // Wide enough to fit all arrows with some padding.
    const panelW = sequence.length * SPACING + 60;
    const panelH = 100;

    this.panel = scene.add.rectangle(cx, cy, panelW, panelH, 0x0a0a22, 0.92)
      .setStrokeStyle(2, 0x3355cc, 1);

    // ── Arrow text objects ───────────────────────────────────
    // Calculate the x position of the first arrow so the whole
    // row is centred around cx.
    const totalW  = (sequence.length - 1) * SPACING;
    const startX  = cx - totalW / 2;

    for (let i = 0; i < sequence.length; i++) {
      const symbol = ARROW_SYMBOLS[sequence[i]];
      const text   = scene.add.text(
        startX + i * SPACING,
        cy,
        symbol,
        { fontSize: ARROW_FONT_SIZE, color: COLOR_UPCOMING }
      ).setOrigin(0.5);

      this.arrowTexts.push(text);
    }

    // Highlight the first arrow immediately
    this.highlightCurrent(0);
  }

  // ----------------------------------------------------------
  // highlightCurrent
  //
  // Updates colours so:
  //   index < currentIndex  → dimmed (already pressed)
  //   index === currentIndex → gold (press this one)
  //   index > currentIndex  → upcoming (grey)
  // ----------------------------------------------------------
  highlightCurrent(currentIndex: number): void {
    for (let i = 0; i < this.arrowTexts.length; i++) {
      if (i < currentIndex) {
        this.arrowTexts[i].setColor(COLOR_DONE);
      } else if (i === currentIndex) {
        this.arrowTexts[i].setColor(COLOR_CURRENT);
      } else {
        this.arrowTexts[i].setColor(COLOR_UPCOMING);
      }
    }
  }

  // ----------------------------------------------------------
  // flashWrong
  //
  // Briefly turns the current arrow red to signal a wrong key.
  // Returns to gold after 200 ms.
  // ----------------------------------------------------------
  flashWrong(currentIndex: number): void {
    if (currentIndex >= this.arrowTexts.length) return;
    this.arrowTexts[currentIndex].setColor(COLOR_WRONG);
    this.scene.time.delayedCall(200, () => {
      // Guard: index might be out of range if scene changed
      if (currentIndex < this.arrowTexts.length) {
        this.arrowTexts[currentIndex].setColor(COLOR_CURRENT);
      }
    });
  }

  // ----------------------------------------------------------
  // destroy
  // Removes all display objects from the scene.
  // Called when transitioning to the next round.
  // ----------------------------------------------------------
  destroy(): void {
    this.panel.destroy();
    this.arrowTexts.forEach(t => t.destroy());
    this.arrowTexts = [];
  }
}
