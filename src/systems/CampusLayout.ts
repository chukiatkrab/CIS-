// ============================================================
// systems/CampusLayout.ts
//
// Defines WHERE every building, path, and tree is placed on
// the campus map.  This is pure DATA — no Phaser API calls.
//
// Keeping layout data separate from drawing code makes it easy
// to move things around without touching rendering logic.
// ============================================================

// ---- Map dimensions (must match MapBuilder constants) ------
export const MAP_WIDTH  = 1600;
export const MAP_HEIGHT = 1200;

// ---- Tile size (pixels) ------------------------------------
export const TILE_SIZE = 32;

// ---- Spawn point -------------------------------------------
// Player starts near the campus entrance (bottom-centre)
export const SPAWN_X = MAP_WIDTH  / 2;
export const SPAWN_Y = MAP_HEIGHT - 120;

// ============================================================
// BuildingDef – data for one building rectangle
// ============================================================
export interface BuildingDef {
  label: string;   // Text shown above the building
  x: number;       // Centre x (world pixels)
  y: number;       // Centre y (world pixels)
  w: number;       // Width  (world pixels)
  h: number;       // Height (world pixels)
  color: number;   // Fill colour (hex)
}

// All buildings on campus
export const BUILDINGS: BuildingDef[] = [
  {
    label: "Registration Office",
    x: 400,  y: 280,
    w: 220,  h: 130,
    color: 0x8855cc,   // purple
  },
  {
    label: "Library",
    x: 800,  y: 280,
    w: 200,  h: 130,
    color: 0x2266bb,   // blue
  },
  {
    label: "Cafeteria",
    x: 400,  y: 580,
    w: 200,  h: 120,
    color: 0xcc6622,   // orange
  },
  {
    label: "Computer Lab",
    x: 800,  y: 580,
    w: 200,  h: 120,
    color: 0x226644,   // teal
  },
];

// ============================================================
// PathDef – data for one stone-path rectangle
// Paths are visual only (no collision).
// ============================================================
export interface PathDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Stone paths connecting buildings and the entrance
export const PATHS: PathDef[] = [
  // Horizontal spine running across the middle of campus
  { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2, w: MAP_WIDTH - 100, h: 48 },

  // Vertical spine from top to bottom
  { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2, w: 48, h: MAP_HEIGHT - 100 },

  // Short path from entrance to vertical spine
  { x: MAP_WIDTH / 2, y: MAP_HEIGHT - 80, w: 80, h: 80 },
];

// ============================================================
// TreeDef – data for one tree
// ============================================================
export interface TreeDef {
  x: number;
  y: number;
  radius: number;  // collision/visual radius (pixels)
}

// Trees placed around the perimeter and between buildings
export const TREES: TreeDef[] = [
  // Top edge row
  { x: 100,  y: 100,  radius: 22 },
  { x: 230,  y: 90,   radius: 20 },
  { x: 580,  y: 100,  radius: 24 },
  { x: 720,  y: 85,   radius: 20 },
  { x: 1000, y: 100,  radius: 22 },
  { x: 1150, y: 90,   radius: 20 },
  { x: 1380, y: 100,  radius: 24 },
  { x: 1480, y: 120,  radius: 20 },

  // Left edge column
  { x: 80,  y: 300,  radius: 22 },
  { x: 80,  y: 500,  radius: 20 },
  { x: 80,  y: 700,  radius: 22 },
  { x: 80,  y: 900,  radius: 20 },

  // Right edge column
  { x: 1520, y: 300, radius: 22 },
  { x: 1520, y: 500, radius: 20 },
  { x: 1520, y: 700, radius: 22 },
  { x: 1520, y: 900, radius: 20 },

  // Between buildings (decorative clusters)
  { x: 600,  y: 280,  radius: 18 },
  { x: 600,  y: 580,  radius: 18 },
  { x: 1000, y: 430,  radius: 20 },
  { x: 200,  y: 430,  radius: 20 },

  // Bottom corners (near entrance)
  { x: 200,  y: 1050, radius: 22 },
  { x: 1400, y: 1050, radius: 22 },
  { x: 350,  y: 1100, radius: 18 },
  { x: 1250, y: 1100, radius: 18 },
];
