// ============================================================
// minigames/CircleType.ts
//
// Defines the data for each type of circle in Reaction Rush.
//
// Adding a new circle type later is as simple as adding a new
// entry to the CIRCLE_TYPES array below.
// ============================================================

/** One entry describing a circle variant */
export interface CircleType {
  /** Internal name, used for debugging */
  name: string;
  /** Colour as a hex number (Phaser format, e.g. 0xff4444) */
  color: number;
  /** Points awarded when clicked */
  points: number;
  /** If true, resets the combo instead of increasing it */
  isBomb: boolean;
}

/** All possible circle types in Reaction Rush */
export const CIRCLE_TYPES: CircleType[] = [
  { name: "red",    color: 0xff4444, points: 10,  isBomb: false },
  { name: "blue",   color: 0x4488ff, points: 20,  isBomb: false },
  { name: "golden", color: 0xffd700, points: 50,  isBomb: false },
  { name: "bomb",   color: 0x222222, points: -20, isBomb: true  },
];

// ----------------------------------------------------------
// pickRandomType
//
// Returns one CircleType at random.
// Golden and bomb circles are rarer because they appear
// less often in the weighted list.
// ----------------------------------------------------------
export function pickRandomType(): CircleType {
  // Weighted pool: red x4, blue x3, golden x1, bomb x2
  const pool: CircleType[] = [
    CIRCLE_TYPES[0], CIRCLE_TYPES[0], CIRCLE_TYPES[0], CIRCLE_TYPES[0], // red
    CIRCLE_TYPES[1], CIRCLE_TYPES[1], CIRCLE_TYPES[1],                   // blue
    CIRCLE_TYPES[2],                                                       // golden
    CIRCLE_TYPES[3], CIRCLE_TYPES[3],                                     // bomb
  ];

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
