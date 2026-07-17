// ============================================================
// scenes/BootScene.ts
//
// First scene to run.
//
// Responsibilities:
//   1. Load the tilemap JSON and tileset image from /assets
//   2. Load the real player sprite PNGs from /assets/characters
//   3. Hand off to MainMenuScene
//
// WHY we load here and not in CampusScene:
//   BootScene is the dedicated "loading" scene.  All assets
//   should be loaded once here so every other scene can use
//   them instantly without repeating load calls.
// ============================================================

import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  // ----------------------------------------------------------
  // preload
  //
  // Phaser calls this automatically before create().
  // All this.load.* calls go here.
  // ----------------------------------------------------------
  preload(): void {
    // Loading label so the screen isn't blank
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Loading...", {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // ---- Tilemap (JSON exported from the TMX) ---------------
    // Key "campus-map" is what CampusScene uses to create the map.
    // The file is served from /assets/maps/ by Vite (publicDir).
    this.load.tilemapTiledJSON("campus-map", "maps/sample-map.json");

    // ---- Tileset image --------------------------------------
    // Key "tileset" is referenced inside the JSON tileset entry.
    this.load.image("tileset", "tiles/tilemap.png");

    // ---- Player sprites -------------------------------------
    // Two separate PNG files are provided, each 16×16 px.
    //
    // tile_0108 – used as the main standing / walking sprite.
    // tile_0109 – available for a second frame or alternate pose.
    //
    // We load both under separate keys so Player.ts (or future
    // animation code) can reference whichever it needs.
    this.load.image("player",       "characters/tile_0108.png");
    this.load.image("player_alt",   "characters/tile_0109.png");
  }

  // ----------------------------------------------------------
  // create
  // Called once preload() finishes.
  // ----------------------------------------------------------
  create(): void {
    // All assets are loaded by this.load.* above.
    // No placeholder generation needed anymore.
    this.scene.start("MainMenuScene");
  }
}
