// ============================================================
// minigames/ReactionRushConfig.ts
//
// Config for "Reaction Rush".
//
// This tells the MinigameScene which Phaser scene to launch
// and what title/instructions to show on the transition screen.
// ============================================================

import { MinigameConfig } from "../types/minigame";

export const ReactionRushConfig: MinigameConfig = {
  sceneKey: "ReactionRushScene",
  title: "Reaction Rush",
  instructions: "Click the circles as fast as you can!",
};
