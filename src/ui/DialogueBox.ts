// ============================================================
// ui/DialogueBox.ts
//
// A traditional RPG dialogue box — always fixed to the screen.
//
// ── WHY SCREEN-SPACE UI IS REQUIRED ─────────────────────────
//
// The campus scene's main camera has zoom=3 and follows the
// player around a scrolling world.  Any object rendered by that
// camera would zoom and move with the world.
//
// We solve this with the two-camera system set up in CampusScene:
//
//   Main camera  (zoom=3, scrolls)  → renders world objects only
//   UI camera    (zoom=1, fixed)    → renders UI Layers only
//
// HOW CAMERA SEPARATION WORKS:
//   1. CampusScene snapshots all world children into a list.
//   2. It tells the uiCamera to ignore that list.
//   3. Any Layer created AFTER that snapshot is automatically
//      visible to the uiCamera (no ignore rule exists for it).
//   4. Each UI Layer calls scene.cameras.main.ignore(layer) so
//      the world camera skips it entirely.
//
// Result: UI coordinates use the fixed 960×640 logical canvas,
// so scene.scale.width/height always give the correct positions
// regardless of browser window size or camera zoom.
//
// ── WHY setScrollFactor(0) DOES NOT WORK ────────────────────
// setScrollFactor(0) stops an object from scrolling but its
// coordinates are still divided by the camera zoom.
// At zoom=3, world x=480 → screen x=160.  Wrong position.
// A dedicated zoom=1 camera avoids this completely.
// ============================================================

import Phaser from "phaser";

export class DialogueBox {
  // The Layer holds every visual part of the dialogue box.
  // CampusScene's main camera is told to ignore this Layer.
  // The uiCamera (zoom=1) renders it automatically.
  private layer: Phaser.GameObjects.Layer;

  private bg:       Phaser.GameObjects.Rectangle;
  private border:   Phaser.GameObjects.Rectangle;
  private divider:  Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hints:    Phaser.GameObjects.Text;

  private _isOpen = false;

  // ----------------------------------------------------------
  // constructor
  // scene – the Phaser scene that owns this dialogue box
  // ----------------------------------------------------------
  constructor(scene: Phaser.Scene) {
    // ── Logical canvas dimensions ───────────────────────────
    // These are always 960×640 (the fixed logical resolution).
    // They never change when the browser is resized — the Scale
    // Manager handles that with CSS, leaving our coordinates intact.
    const sw = scene.scale.width;   // always 960
    const sh = scene.scale.height;  // always 640

    // ── Box geometry ────────────────────────────────────────
    // 40px horizontal margin on each side → box is 880px wide.
    // Height = 32% of canvas, minimum 160px.
    // Positioned in the lower portion: 20px above the bottom edge.
    const margin = 40;
    const boxW   = sw - margin * 2;          // 880
    const boxH   = Math.max(sh * 0.32, 160); // ~205

    // Centre point of the box (screen pixels)
    const cx = sw / 2;                       // 480
    const cy = sh - boxH / 2 - 20;          // ~414

    // ── Layer ───────────────────────────────────────────────
    // Using a Layer allows cameras to selectively ignore it.
    // depth=100 puts it above all world objects (depths 0-10).
    this.layer = scene.add.layer();
    this.layer.setDepth(100);

    // Tell the WORLD camera to skip this Layer.
    // Without this, the main camera would draw the dialogue box
    // at the wrong zoom level over the game world.
    scene.cameras.main.ignore(this.layer);

    // ── Visuals ─────────────────────────────────────────────
    // Every object is added to the layer, not to the scene directly.
    // Coordinates are logical canvas pixels (960×640 space).

    // Outer border — a solid-colour rectangle slightly larger than bg
    this.border = scene.add.rectangle(cx, cy, boxW + 6, boxH + 6, 0x3355cc, 1);
    this.layer.add(this.border);

    // Dark background
    this.bg = scene.add.rectangle(cx, cy, boxW, boxH, 0x0a0a22, 0.97);
    this.layer.add(this.bg);

    // Speaker name — top-left, 16px from each edge
    this.nameText = scene.add.text(
      cx - boxW / 2 + 16,
      cy - boxH / 2 + 14,
      "",
      { fontSize: "16px", color: "#f5c518", fontStyle: "bold" }
    );
    this.layer.add(this.nameText);

    // Thin divider under the name
    this.divider = scene.add.rectangle(
      cx, cy - boxH / 2 + 38,
      boxW - 24, 2,
      0x334488, 1
    );
    this.layer.add(this.divider);

    // Dialogue body text — wraps inside the box
    this.bodyText = scene.add.text(
      cx - boxW / 2 + 16,
      cy - boxH / 2 + 48,
      "",
      {
        fontSize: "14px",
        color: "#e8e8e8",
        wordWrap: { width: boxW - 32 }, // stay inside the box
        lineSpacing: 6,
      }
    );
    this.layer.add(this.bodyText);

    // Key hints — centred at the bottom of the box
    this.hints = scene.add.text(
      cx,
      cy + boxH / 2 - 16,
      "[ENTER]  Accept Quest          [ESC]  Leave",
      { fontSize: "12px", color: "#8888bb" }
    ).setOrigin(0.5, 1); // centre-x, bottom-aligned
    this.layer.add(this.hints);

    // Start hidden — open() makes it visible
    this.layer.setVisible(false);
  }

  // ----------------------------------------------------------
  // open
  // Show the dialogue box with new content.
  //
  // speakerName – displayed in the name header  (e.g. "Professor")
  // text        – dialogue body; use \n for line breaks
  // hintText    – optional override for the bottom hint line
  // ----------------------------------------------------------
  open(speakerName: string, text: string, hintText?: string): void {
    this.nameText.setText(speakerName);
    this.bodyText.setText(text);
    // Use the provided hint or fall back to the default accept/leave text
    if (hintText !== undefined) {
      this.hints.setText(hintText);
    } else {
      this.hints.setText("[ENTER]  Accept Quest          [ESC]  Leave");
    }
    this.layer.setVisible(true);
    this._isOpen = true;
  }

  // ----------------------------------------------------------
  // close – hide the dialogue box
  // ----------------------------------------------------------
  close(): void {
    this.layer.setVisible(false);
    this._isOpen = false;
  }

  // ----------------------------------------------------------
  // isOpen – returns true while the box is visible
  // ----------------------------------------------------------
  isOpen(): boolean {
    return this._isOpen;
  }

  // ----------------------------------------------------------
  // getLayer
  // CampusScene calls this to pass the Layer to
  // cameras.main.ignore(), keeping the two-camera system clean.
  // ----------------------------------------------------------
  getLayer(): Phaser.GameObjects.Layer {
    return this.layer;
  }
}
