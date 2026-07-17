// ============================================================
// main.ts  –  Phaser game entry point
// ============================================================
//
// ── RESPONSIVE SCALING EXPLAINED ────────────────────────────
//
// A Phaser game has two separate concepts of "size":
//
//   1. LOGICAL size  (width / height in the config below)
//      The internal resolution that all game coordinates use.
//      scene.scale.width is ALWAYS this value.
//      Tiles, sprites, UI objects are all positioned in this
//      coordinate space.  We keep it fixed at 960×640 so every
//      calculation in every scene is predictable.
//
//   2. DISPLAY size  (what the player actually sees on screen)
//      Phaser's Scale Manager CSS-scales the <canvas> element
//      to fit the browser window while preserving the aspect ratio.
//      The game logic never needs to know the display size.
//
// With Scale.FIT + CENTER_BOTH:
//   • The canvas shrinks or grows to fill the window.
//   • Black bars appear on the sides OR top/bottom (letter-boxing)
//     when the window aspect ratio doesn't match 960:640 (3:2).
//   • All coordinate maths inside scenes use 960×640 — always correct.
//
// WHY NOT use a dynamic size that matches the window exactly?
//   That would require every UI object to reposition itself on
//   every resize.  Keeping a fixed logical size is simpler, safer,
//   and the standard approach for 2D games.
//
// ── TWO-CAMERA UI SYSTEM ────────────────────────────────────
// CampusScene adds a second UI camera (zoom=1) that renders
// UI Layers.  Because the logical canvas is always 960×640, UI
// positions computed from scene.scale.width/height are always
// correct — even after the browser is resized.
// ============================================================

import Phaser from "phaser";
import { BootScene }             from "./scenes/BootScene";
import { MainMenuScene }         from "./scenes/MainMenuScene";
import { CampusScene }           from "./scenes/CampusScene";
import { MinigameScene }         from "./scenes/MinigameScene";
import { ResultScene }           from "./scenes/ResultScene";
import { ReactionRushScene }     from "./scenes/ReactionRushScene";
import { ClickChallengeScene }   from "./scenes/ClickChallengeScene";
import { RhythmArrowScene }      from "./scenes/RhythmArrowScene";
import { ReactionPopupScene }    from "./scenes/ReactionPopupScene";
import { BossFightScene }        from "./scenes/BossFightScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL with Canvas fallback

  // ── Logical canvas size ────────────────────────────────────
  // All game coordinates are in this 960×640 space.
  // This never changes, even when the browser window resizes.
  width:  960,
  height: 640,

  // ── Scale Manager ─────────────────────────────────────────
  scale: {
    // FIT scales the canvas UP or DOWN to fill the browser window
    // while keeping the 960:640 aspect ratio intact.
    // Black letter-box bars appear on edges that don't match.
    mode: Phaser.Scale.FIT,

    // CENTER_BOTH centres the canvas horizontally and vertically
    // inside the browser window.
    autoCenter: Phaser.Scale.CENTER_BOTH,

    // parent defaults to document.body — Phaser injects <canvas> there.
  },

  backgroundColor: "#000000",

  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 }, // top-down game — no gravity
      debug: false,
    },
  },

  scene: [
    BootScene,
    MainMenuScene,
    CampusScene,
    MinigameScene,
    ResultScene,
    ReactionRushScene,
    ClickChallengeScene,
    RhythmArrowScene,
    ReactionPopupScene,
    BossFightScene,
  ],
};

new Phaser.Game(config);
