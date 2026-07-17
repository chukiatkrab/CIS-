// ============================================================
// systems/MapBuilder.ts
//
// Builds the campus world from the real Tiled map.
//
// How Phaser tilemaps work (explained simply):
//
//   1. this.make.tilemap({ key })
//      Reads the JSON we loaded in BootScene and creates a
//      Tilemap object that knows the grid size, layer names,
//      and tile numbers.
//
//   2. map.addTilesetImage(tilesetName, imageKey)
//      Links the tileset name used inside the JSON to the
//      image we loaded in BootScene.
//      Returns a Tileset object we pass to createLayer().
//
//   3. map.createLayer(layerName, tileset, x, y)
//      Draws one layer of tiles onto the scene.
//      Returns a TilemapLayer – a special game object that
//      also supports arcade physics collision.
//
// We have two layers in our map:
//   "Terrain" – ground tiles (grass, paths, floors)
//   "Objects" – decorative tiles on top (trees, rocks, etc.)
// ============================================================

import Phaser from "phaser";

// ---- Map constants -----------------------------------------
// The map is 55 × 30 tiles, each tile is 8 × 8 pixels.
export const MAP_TILE_WIDTH  = 55;
export const MAP_TILE_HEIGHT = 30;
export const TILE_SIZE       = 8;
export const MAP_WIDTH       = MAP_TILE_WIDTH  * TILE_SIZE; // 440 px
export const MAP_HEIGHT      = MAP_TILE_HEIGHT * TILE_SIZE; // 240 px

// ---- Spawn point -------------------------------------------
// Centre of the map – a neutral safe starting position.
// CampusScene imports this to know where to place the player.
export const SPAWN_X = MAP_WIDTH  / 2; // 220
export const SPAWN_Y = MAP_HEIGHT / 2; // 120

// ---- What MapBuilder.build() returns ----------------------
export interface MapResult {
  // The Objects layer has collision enabled so the player
  // cannot walk through trees, rocks, etc.
  objectLayer: Phaser.Tilemaps.TilemapLayer;
}

export class MapBuilder {
  // ----------------------------------------------------------
  // build
  //
  // Call once from CampusScene.create().
  // Creates and displays both tile layers.
  // Returns the Objects layer so CampusScene can set up a
  // collider between the player and solid tiles.
  //
  // scene - the scene that owns the map
  // ----------------------------------------------------------
  static build(scene: Phaser.Scene): MapResult {
    // ---- Step 1: Create the Tilemap object -----------------
    // "campus-map" matches the key used in BootScene preload().
    const map = scene.make.tilemap({ key: "campus-map" });

    // ---- Step 2: Link the tileset image --------------------
    // First arg  = name inside the JSON  ("city-tileset" from the TSX)
    // Second arg = texture key loaded in BootScene ("tileset")
    const tileset = map.addTilesetImage("city-tileset", "tileset")!;

    // ---- Step 3: Create tile layers ------------------------
    // The order matters: Terrain draws first (bottom), Objects on top.

    // Ground layer – grass, paths, floor tiles.
    // No collision needed here; the player walks on this layer.
    const terrainLayer = map.createLayer("Terrain", tileset, 0, 0)!;
    terrainLayer.setDepth(0); // render below everything

    // Object layer – trees, decorations, walls.
    // We will enable collision on non-zero tiles.
    const objectLayer = map.createLayer("Objects", tileset, 0, 0)!;
    objectLayer.setDepth(1); // render above terrain, below player

    // ---- Step 4: Enable collision on the Objects layer -----
    // setCollisionByExclusion([-1]) means:
    //   "every tile EXCEPT tile index -1 (empty) blocks movement."
    // This way any visible tile in the Objects layer is solid.
    objectLayer.setCollisionByExclusion([-1]);

    // ---- Step 5: Tell the physics world the map boundaries -
    // This prevents the player from walking off the edges.
    scene.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    return { objectLayer };
  }
}
