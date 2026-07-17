// ============================================================
// npc/NPC.ts
//
// Represents a single NPC (Non-Player Character) in the world.
//
// Responsibilities:
//   - Display the NPC sprite at a fixed world position
//   - Show a "Press [E] to Talk" prompt when the player is near
//   - Tell the outside world whether the player is close enough
//
// This class does NOT handle dialogue or quests.
// Those are handled by DialogueBox and QuestManager.
// ============================================================

import Phaser from "phaser";

// How close (in world pixels) the player must be to trigger
// the interaction prompt.
const INTERACTION_RADIUS = 20;

export class NPC {
  // The NPC's visible sprite
  private sprite: Phaser.GameObjects.Image;

  // The "Press [E] to Talk" label that floats above the sprite
  private prompt: Phaser.GameObjects.Text;

  // The NPC's name – shown in the dialogue box header
  public readonly name: string;

  // The lines of dialogue this NPC will say
  // Made public so CampusScene can update it after quest completion.
  public dialogue: string[];

  // ----------------------------------------------------------
  // constructor
  //
  // scene    – the scene to add objects to
  // x, y     – world position (in world/tile pixels)
  // name     – NPC name shown in the dialogue header
  // dialogue – array of text lines to display in sequence
  // ----------------------------------------------------------
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    dialogue: string[]
  ) {
    this.name     = name;
    this.dialogue = dialogue;

    // ---- Sprite ---------------------------------------------
    // We use "player_alt" (tile_0109.png) as a simple placeholder
    // to distinguish the NPC from the player.
    // A real NPC sprite can be swapped in by changing the key.
    this.sprite = scene.add
      .image(x, y, "player_alt")
      .setScale(0.75)      // same scale as the player for consistency
      .setDepth(4);        // above tiles (depth 0-1) but below player (5)

    // ---- Interaction prompt ---------------------------------
    // Floats 12 world-px above the NPC sprite.
    // setScrollFactor(1) keeps it attached to the world (not the camera).
    this.prompt = scene.add
      .text(x, y - 12, "Press [E] to Talk", {
        fontSize: "5px",          // small to fit the 8×8 tile scale
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "#00000066",
        padding: { x: 2, y: 1 },
      })
      .setOrigin(0.5, 1)   // centre-bottom anchor → sits above NPC
      .setDepth(10)         // always on top of everything in the world
      .setVisible(false);   // hidden until player is close
  }

  // ----------------------------------------------------------
  // isNearPlayer
  //
  // Returns true when the player is within INTERACTION_RADIUS
  // world pixels of this NPC.
  //
  // We use a simple distance check (no physics overlap needed).
  // ----------------------------------------------------------
  isNearPlayer(player: Phaser.GameObjects.Components.Transform): boolean {
    const dx = (player.x) - this.sprite.x;
    const dy = (player.y) - this.sprite.y;
    // Pythagoras: distance = √(dx² + dy²)
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= INTERACTION_RADIUS;
  }

  // ----------------------------------------------------------
  // showPrompt
  //
  // Shows or hides the "Press [E] to Talk" label.
  // Called every frame by CampusScene based on player proximity.
  // ----------------------------------------------------------
  showPrompt(visible: boolean): void {
    this.prompt.setVisible(visible);
  }

  // ----------------------------------------------------------
  // setScale
  //
  // Changes the visual size of the NPC sprite.
  // Used by CampusScene to make important NPCs look bigger.
  // ----------------------------------------------------------
  setScale(scale: number): void {
    this.sprite.setScale(scale);
  }

  // ----------------------------------------------------------
  // getPosition
  //
  // Returns the NPC's world position.
  // Useful for positioning the dialogue box nearby.
  // ----------------------------------------------------------
  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }
}
