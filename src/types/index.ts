// ============================================================
// types/index.ts
// Shared type definitions used across the game.
// Keeping types in one place makes them easy to find and change.
// ============================================================

/** Directions the player can face / move */
export type Direction = "up" | "down" | "left" | "right";

/** Data passed between scenes (e.g., score carry-over) */
export interface SceneData {
  score?: number;
}
