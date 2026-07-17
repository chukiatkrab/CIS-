// ============================================================
// player/Player.ts
//
// The Player class – handles movement only.
//
// Sprite source: assets/characters/tile_0108.png  (16 × 16 px)
// ============================================================

import Phaser from "phaser";

// ---- Movement speed ----------------------------------------
// Previously 60 px/s, which was too slow on the small 8×8 tile
// world.  At camera zoom 3×, 60 world-px/s looked like crawling.
// 80 world-px/s × 3 zoom = 240 screen-px/s, which feels
// responsive while still being easy to control.
const PLAYER_SPEED = 80;

// ---- Visual scale ------------------------------------------
// The sprite is 16×16 px.  Each map tile is 8×8 px.
// At scale 1.0 the sprite would be 2 tiles wide — too large.
//
// WHY we scale:
//   We never distort the source image.  Instead we use
//   setScale() so Phaser renders it at a different size while
//   the original PNG stays untouched.  This also makes it
//   trivial to try different sizes by changing one number.
//
// Scale 0.75 → rendered size = 16 × 0.75 = 12 × 12 px
//   → At camera zoom 3×  = 36 × 36 screen pixels
//   → ≈ 1.5 tiles tall   – clearly visible, fits in corridors
const PLAYER_SCALE = 0.75;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;

  // ----------------------------------------------------------
  // constructor
  // scene – the scene this player belongs to
  // x, y  – starting world position (world pixels, pre-zoom)
  // ----------------------------------------------------------
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // "player" is loaded in BootScene from tile_0108.png
    super(scene, x, y, "player");

    // Register with the scene's display list and physics engine
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // ---- Scale the sprite ----------------------------------
    // The PNG is 16×16 px.  At PLAYER_SCALE the rendered sprite
    // becomes 12×12 px in world space, fitting naturally in the
    // 8-px tile grid without stretching the image.
    this.setScale(PLAYER_SCALE);

    // ---- Physics body size ---------------------------------
    // The physics body controls collision, not the visual size.
    // We use a smaller body (8×8 px) centred on the sprite so
    // the player's feet align with the tile grid and can pass
    // through single-tile-wide openings.
    //
    // Scaled sprite dimensions: 16 × 0.75 = 12 × 12 px
    // Body size: 8 × 8 px
    // Offset to centre body inside sprite:
    //   offsetX = (12 - 8) / 2 = 2
    //   offsetY = (12 - 8) / 2 = 2
    //
    // NOTE: setSize / setOffset work in the sprite's LOCAL
    // (pre-scale) pixel space, so we divide by PLAYER_SCALE.
    //   bodyW_local = 8 / 0.75 ≈ 10.67  → round to 10
    //   offsetX_local = (16 - 10.67) / 2 ≈ 2.67  → round to 3
    const bodyW   = Math.round(8  / PLAYER_SCALE); // ≈ 10 local px
    const offsetX = Math.round((16 - 8 / PLAYER_SCALE) / 2); // ≈ 3
    const offsetY = Math.round((16 - 8 / PLAYER_SCALE) / 2); // ≈ 3

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(bodyW, bodyW);
    body.setOffset(offsetX, offsetY);

    // Keep the player inside the world rectangle
    this.setCollideWorldBounds(true);

    // Arrow keys
    this.cursors = scene.input.keyboard!.createCursorKeys();

    // WASD
    this.keyW = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  // ----------------------------------------------------------
  // update
  // Called every frame from CampusScene.
  // Reads keyboard input and applies velocity.
  // ----------------------------------------------------------
  update(): void {
    // Reset every frame so the player stops immediately
    // when no key is held
    this.setVelocity(0, 0);

    // Horizontal
    if (this.cursors.left.isDown  || this.keyA.isDown) {
      this.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown || this.keyD.isDown) {
      this.setVelocityX(PLAYER_SPEED);
    }

    // Vertical
    if (this.cursors.up.isDown   || this.keyW.isDown) {
      this.setVelocityY(-PLAYER_SPEED);
    } else if (this.cursors.down.isDown  || this.keyS.isDown) {
      this.setVelocityY(PLAYER_SPEED);
    }

    // Diagonal normalisation:
    // Holding two directions gives a velocity vector at 45°.
    // Its magnitude is √(speed² + speed²) = speed × √2 ≈ 1.41×.
    // Multiplying by 1/√2 ≈ 0.7071 restores the original speed.
    const pb = this.body as Phaser.Physics.Arcade.Body;
    if (pb.velocity.x !== 0 && pb.velocity.y !== 0) {
      this.setVelocity(
        pb.velocity.x * 0.7071,
        pb.velocity.y * 0.7071
      );
    }
  }
}
