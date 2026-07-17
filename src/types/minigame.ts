// ============================================================
// types/minigame.ts
//
// Defines the shared "contract" for every minigame.
//
// HOW THE FRAMEWORK WORKS:
//   1. CampusScene calls:
//        this.scene.start("MinigameScene", myMinigameConfig)
//   2. MinigameScene reads the config and runs whatever is
//      described inside it.
//   3. When the minigame ends it passes a MinigameResult to
//      ResultScene.
//   4. ResultScene shows the result and sends the player back.
//
// To add a NEW minigame later, just create a new MinigameConfig
// object. You do NOT need to touch CampusScene or MinigameScene.
// ============================================================

/** The result produced when a minigame finishes. */
export interface MinigameResult {
  score: number;      // numeric score (e.g. 850)
  accuracy: number;   // percentage 0–100 (e.g. 92)
  rank: string;       // letter rank  (e.g. "A")
}

/**
 * Configuration object that describes one minigame.
 *
 * CampusScene passes this to MinigameScene.
 * MinigameScene reads `sceneKey` and starts the correct scene.
 *
 * To add a NEW minigame:
 *   1. Create a new Phaser scene (e.g. QuizRushScene)
 *   2. Create a new config with its sceneKey
 *   3. Register the scene in main.ts
 *   That's all — nothing else needs to change.
 */
export interface MinigameConfig {
  /** The Phaser scene key to launch (e.g. "ReactionRushScene") */
  sceneKey: string;

  /** Name displayed on the transition / loading screen */
  title: string;

  /** Short instruction shown before gameplay starts */
  instructions: string;
}
