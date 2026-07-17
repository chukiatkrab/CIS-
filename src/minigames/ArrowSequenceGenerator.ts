// ============================================================
// minigames/ArrowSequenceGenerator.ts
//
// Responsibility: generate arrow sequences and provide
// difficulty settings for each round.
//
// This file contains NO Phaser API calls — pure TypeScript.
// Keeping data logic separate from scene logic makes both
// easier to read and modify.
// ============================================================

// The four possible arrow directions
export type ArrowDir = "UP" | "DOWN" | "LEFT" | "RIGHT";

// The Unicode arrow characters shown on screen for each direction
export const ARROW_SYMBOLS: Record<ArrowDir, string> = {
  UP:    "↑",
  DOWN:  "↓",
  LEFT:  "←",
  RIGHT: "→",
};

// The Phaser key code string for each direction
// Used to register keyboard listeners with addKey()
export const ARROW_KEYCODES: Record<ArrowDir, number> = {
  UP:    Phaser.Input.Keyboard.KeyCodes.UP,
  DOWN:  Phaser.Input.Keyboard.KeyCodes.DOWN,
  LEFT:  Phaser.Input.Keyboard.KeyCodes.LEFT,
  RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
};

// Settings that change with each round
export interface RoundSettings {
  arrowCount: number;   // how many arrows in the sequence
  timePerKey: number;   // milliseconds the player has per key press
}

// All four directions in an array so we can pick randomly
const ALL_DIRECTIONS: ArrowDir[] = ["UP", "DOWN", "LEFT", "RIGHT"];

// ----------------------------------------------------------
// getSettingsForRound
//
// Returns difficulty settings based on round number (1-indexed).
//
// round 1–2 → 4 arrows, 1200 ms each
// round 3–4 → 6 arrows, 1000 ms each
// round 5+  → 8 arrows,  800 ms each
// ----------------------------------------------------------
export function getSettingsForRound(round: number): RoundSettings {
  if (round <= 2) return { arrowCount: 4, timePerKey: 1200 };
  if (round <= 4) return { arrowCount: 6, timePerKey: 1000 };
  return              { arrowCount: 8, timePerKey:  800 };
}

// ----------------------------------------------------------
// generateSequence
//
// Returns an array of `count` randomly chosen ArrowDirs.
// We avoid repeating the same direction twice in a row so
// the sequence is never trivially easy to button-mash.
// ----------------------------------------------------------
export function generateSequence(count: number): ArrowDir[] {
  const seq: ArrowDir[] = [];
  let last: ArrowDir | null = null;

  for (let i = 0; i < count; i++) {
    // Build a pool that excludes the previous direction
    const pool = ALL_DIRECTIONS.filter(d => d !== last);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    seq.push(pick);
    last = pick;
  }

  return seq;
}
