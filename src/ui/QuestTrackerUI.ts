// ============================================================
// ui/QuestTrackerUI.ts
//
// A screen-space panel that shows quest progress.
//
// Layout (top-right corner):
//   ┌─────────────────────────┐
//   │  QUESTS                 │
//   │  ✓ Click Challenge      │  ← completed (grey)
//   │  ► Rhythm Arrow         │  ← in_progress (gold)
//   │  - Reaction Popup       │  ← not_started (dim)
//   └─────────────────────────┘
//
// Lives on a UI Layer so the main (zoomed) camera ignores it
// and the uiCamera (zoom=1) renders it correctly.
// Call refresh() whenever quest state changes.
// ============================================================

import Phaser from "phaser";
import { QuestManager } from "../systems/QuestManager";

// Visual constants
const PANEL_X      = 960 - 16;  // right edge of the 960-wide canvas
const PANEL_Y      = 16;
const PANEL_W      = 220;
const LINE_H       = 22;        // px between each quest row
const PADDING      = 10;

export class QuestTrackerUI {
  private scene:        Phaser.Scene;
  private questManager: QuestManager;

  // The layer all objects sit on — the main camera ignores this
  private layer: Phaser.GameObjects.Layer;

  // Background panel (resized in refresh())
  private panelBg!: Phaser.GameObjects.Rectangle;

  // Array of text objects, one per quest row + the header
  private textObjects: Phaser.GameObjects.Text[] = [];

  // ----------------------------------------------------------
  // constructor
  // scene        – the Phaser scene
  // questManager – shared quest state
  // ----------------------------------------------------------
  constructor(scene: Phaser.Scene, questManager: QuestManager) {
    this.scene        = scene;
    this.questManager = questManager;

    // Create a UI layer that the main camera ignores
    this.layer = scene.add.layer();
    this.layer.setDepth(95); // above world, below dialogue (100)
    scene.cameras.main.ignore(this.layer);

    // Build initial display
    this.rebuild();
  }

  // ----------------------------------------------------------
  // refresh
  //
  // Call this every time quest state changes.
  // Destroys the old text objects and rebuilds from scratch.
  // ----------------------------------------------------------
  refresh(): void {
    this.rebuild();
  }

  // ----------------------------------------------------------
  // rebuild  (private)
  //
  // Clears all text objects and redraws the panel.
  // ----------------------------------------------------------
  private rebuild(): void {
    // Destroy previous objects
    this.textObjects.forEach(t => t.destroy());
    this.textObjects = [];
    if (this.panelBg) this.panelBg.destroy();

    const quests = this.questManager.getAllQuests();
    // Each quest = 1 line; header = 1 line; top/bottom padding
    const panelH = PADDING * 2 + LINE_H * (quests.length + 1);

    // Panel background — right-aligned, anchored top-right
    const panelLeft = PANEL_X - PANEL_W; // left edge of panel
    const panelCx   = panelLeft + PANEL_W / 2;
    const panelCy   = PANEL_Y + panelH / 2;

    this.panelBg = this.scene.add
      .rectangle(panelCx, panelCy, PANEL_W, panelH, 0x000000, 0.55);
    this.layer.add(this.panelBg);

    // ── Header ────────────────────────────────────────────────
    const header = this.scene.add.text(
      PANEL_X - PANEL_W + PADDING,
      PANEL_Y + PADDING,
      "QUESTS",
      { fontSize: "13px", color: "#f5c518", fontStyle: "bold" }
    );
    this.layer.add(header);
    this.textObjects.push(header);

    // ── One row per quest ─────────────────────────────────────
    quests.forEach((q, i) => {
      const y = PANEL_Y + PADDING + LINE_H * (i + 1);

      // Choose prefix symbol and colour based on status
      let prefix: string;
      let color:  string;

      if (q.status === "completed") {
        prefix = "✓ ";
        color  = "#888888"; // dim grey — done
      } else if (q.status === "in_progress") {
        prefix = "► ";
        color  = "#f5c518"; // gold — active
      } else {
        prefix = "- ";
        color  = "#555555"; // very dim — not started
      }

      const row = this.scene.add.text(
        PANEL_X - PANEL_W + PADDING,
        y,
        prefix + q.name,
        { fontSize: "12px", color }
      );
      this.layer.add(row);
      this.textObjects.push(row);
    });
  }
}
