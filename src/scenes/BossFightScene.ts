// ============================================================
// scenes/BossFightScene.ts
//
// "Code Survival Test" – Final Boss minigame
// Inspired by Undertale bullet-hell gameplay.
//
// ── STRUCTURE ────────────────────────────────────────────────
//  Phase 1 (0-20s)  Falling error blocks from the top
//  Phase 2 (20-40s) Horizontal sweep bars with a safe gap
//  Phase 3 (40-60s) Random bullets from all four walls
//  update()         Move heart, check collision
//  onHit()          Flash red → show GAME OVER screen
//  onVictory()      Flash white → show VICTORY screen
//
// ── RETURN ───────────────────────────────────────────────────
//  scene.start("CampusScene")  – standalone, no quest data
// ============================================================

import Phaser from "phaser";

// ── Battle-box dimensions (logical pixels) ───────────────────
const BOX_X = 480;
const BOX_Y = 340;
const BOX_W = 400;
const BOX_H = 280;

const BOX_LEFT   = BOX_X - BOX_W / 2;
const BOX_RIGHT  = BOX_X + BOX_W / 2;
const BOX_TOP    = BOX_Y - BOX_H / 2;
const BOX_BOTTOM = BOX_Y + BOX_H / 2;

// ── Player constants ─────────────────────────────────────────
const HEART_SPEED  = 180; // px/s
const HEART_RADIUS = 8;

// ── Timing ───────────────────────────────────────────────────
const TOTAL_TIME   = 60;
const P1_INTERVAL  = 900;
const P2_INTERVAL  = 1400;
const P3_INTERVAL  = 450;

// ── Boss display name ─────────────────────────────────────────
// Thai title "ศาสตราจารย์ปโยธร" = Professor Payothorn
const BOSS_NAME = "ศาสตราจารย์ปโยธร (Payothorn Urathumkul)";

export class BossFightScene extends Phaser.Scene {

  // ── Heart (player) ────────────────────────────────────────
  private heart!: Phaser.GameObjects.Arc;
  private heartX  = BOX_X;
  private heartY  = BOX_Y + 80;

  // ── Obstacles (Rectangle or Arc shapes) ──────────────────
  private obstacles: Phaser.GameObjects.Shape[] = [];

  // ── HUD ──────────────────────────────────────────────────
  private timerText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private hpText!:    Phaser.GameObjects.Text;

  // ── State ────────────────────────────────────────────────
  private alive        = true;
  private gameFinished = false;
  private elapsed      = 0;       // seconds elapsed
  private currentPhase = 0;       // 1, 2, or 3
  private spawnTimer   = 0;       // ms until next spawn

  // ── Input ────────────────────────────────────────────────
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;

  constructor() { super("BossFightScene"); }

  // ----------------------------------------------------------
  // create
  // ----------------------------------------------------------
  create(): void {
    // Reset all state so the scene works cleanly if replayed
    this.alive        = true;
    this.gameFinished = false;
    this.elapsed      = 0;
    this.currentPhase = 0;
    this.spawnTimer   = 0;
    this.obstacles    = [];
    this.heartX       = BOX_X;
    this.heartY       = BOX_Y + 80;

    const { width, height } = this.scale;

    // ── Background ──────────────────────────────────────────
    this.cameras.main.setBackgroundColor("#0a0a0a");

    // ── Boss name header ─────────────────────────────────────
    this.add.text(width / 2, 30, BOSS_NAME, {
      fontSize: "20px", color: "#ff4444", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, 56, "Code Survival Test", {
      fontSize: "13px", color: "#aaaaaa",
    }).setOrigin(0.5);

    // ── Battle box ───────────────────────────────────────────
    this.add.rectangle(BOX_X, BOX_Y, BOX_W + 8, BOX_H + 8, 0xffffff, 1);
    this.add.rectangle(BOX_X, BOX_Y, BOX_W, BOX_H, 0x111111, 1);

    // ── Heart ────────────────────────────────────────────────
    this.heart = this.add.circle(this.heartX, this.heartY, HEART_RADIUS, 0xff2222);
    this.heart.setDepth(10);

    // ── HUD ──────────────────────────────────────────────────
    this.hpText = this.add.text(20, 18, "HP: ♥", {
      fontSize: "18px", color: "#ff4444",
    });

    this.timerText = this.add.text(width / 2, height - 28,
      `Survive: ${TOTAL_TIME}s`,
      { fontSize: "18px", color: "#ffffff" }
    ).setOrigin(0.5, 1);

    this.phaseText = this.add.text(width - 20, 18, "Phase 1", {
      fontSize: "16px", color: "#ffcc00",
    }).setOrigin(1, 0);

    // ── Instruction hint (fades after 2 s) ───────────────────
    const hint = this.add.text(width / 2, height - 52,
      "Move with WASD or Arrow Keys — don't get hit!",
      { fontSize: "13px", color: "#666666" }
    ).setOrigin(0.5, 1);
    this.time.delayedCall(2000, () => hint.setVisible(false));

    // ── Input ────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyW    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // ── Countdown timer (fires every second) ─────────────────
    this.time.addEvent({
      delay: 1000,
      repeat: TOTAL_TIME - 1,
      callback: this.onSecond,
      callbackScope: this,
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.currentPhase = 1;
  }

  // ----------------------------------------------------------
  // onSecond – fires every second via the timer event
  // ----------------------------------------------------------
  private onSecond(): void {
    if (!this.alive || this.gameFinished) return;

    this.elapsed += 1;
    const remaining = TOTAL_TIME - this.elapsed;
    this.timerText.setText(`Survive: ${remaining}s`);

    if (remaining <= 10) this.timerText.setColor("#ff4444");

    // Phase transitions
    if (this.elapsed === 20) {
      this.currentPhase = 2;
      this.phaseText.setText("Phase 2");
      this.clearObstacles();
    } else if (this.elapsed === 40) {
      this.currentPhase = 3;
      this.phaseText.setText("Phase 3");
      this.clearObstacles();
    } else if (this.elapsed >= TOTAL_TIME) {
      this.onVictory();
    }
  }

  // ----------------------------------------------------------
  // clearObstacles
  // ----------------------------------------------------------
  private clearObstacles(): void {
    for (const obs of this.obstacles) obs.destroy();
    this.obstacles = [];
  }

  // ── Phase 1 ── Falling error blocks ──────────────────────
  private spawnPhase1(): void {
    const x     = Phaser.Math.Between(BOX_LEFT + 20, BOX_RIGHT - 20);
    const block = this.add.rectangle(x, BOX_TOP + 5, 40, 18, 0xff3300);
    this.add.text(x, BOX_TOP + 5, "ERR", {
      fontSize: "10px", color: "#ffffff",
    }).setOrigin(0.5);
    block.setData("vy", Phaser.Math.Between(80, 130));
    this.obstacles.push(block);
  }

  // ── Phase 2 ── Horizontal sweep bars with a safe gap ─────
  private spawnPhase2(): void {
    const fromLeft = Math.random() < 0.5;
    const gapTop   = Phaser.Math.Between(BOX_TOP + 10, BOX_BOTTOM - 90);
    const gapBot   = gapTop + 80;

    // Upper segment (above the gap)
    if (gapTop > BOX_TOP + 4) {
      const h   = gapTop - BOX_TOP;
      const bar = this.add.rectangle(
        fromLeft ? BOX_LEFT - 10 : BOX_RIGHT + 10,
        BOX_TOP + h / 2,
        BOX_W + 20, h, 0x0055ff
      );
      bar.setData("vx", fromLeft ? 160 : -160);
      this.obstacles.push(bar);
    }

    // Lower segment (below the gap)
    if (gapBot < BOX_BOTTOM - 4) {
      const h   = BOX_BOTTOM - gapBot;
      const bar = this.add.rectangle(
        fromLeft ? BOX_LEFT - 10 : BOX_RIGHT + 10,
        gapBot + h / 2,
        BOX_W + 20, h, 0x0055ff
      );
      bar.setData("vx", fromLeft ? 160 : -160);
      this.obstacles.push(bar);
    }
  }

  // ── Phase 3 ── Random bullets from all four walls ────────
  private spawnPhase3(): void {
    const wall  = Phaser.Math.Between(0, 3);
    const speed = Phaser.Math.Between(160, 260);

    let x: number, y: number, vx: number, vy: number;

    if (wall === 0) {        // top
      x = Phaser.Math.Between(BOX_LEFT + 5, BOX_RIGHT - 5);
      y = BOX_TOP - 6;      vx = 0;     vy = speed;
    } else if (wall === 1) { // bottom
      x = Phaser.Math.Between(BOX_LEFT + 5, BOX_RIGHT - 5);
      y = BOX_BOTTOM + 6;   vx = 0;     vy = -speed;
    } else if (wall === 2) { // left
      x = BOX_LEFT - 6;
      y = Phaser.Math.Between(BOX_TOP + 5, BOX_BOTTOM - 5);
      vx = speed;  vy = 0;
    } else {                 // right
      x = BOX_RIGHT + 6;
      y = Phaser.Math.Between(BOX_TOP + 5, BOX_BOTTOM - 5);
      vx = -speed; vy = 0;
    }

    const colours = [0xff6600, 0xffcc00, 0xff00cc, 0x00ffcc];
    const color   = colours[Phaser.Math.Between(0, 3)];

    const bullet = this.add.circle(x, y, 8, color);
    bullet.setData("vx", vx);
    bullet.setData("vy", vy);
    this.obstacles.push(bullet);
  }

  // ----------------------------------------------------------
  // onHit – instant game over
  // ----------------------------------------------------------
  private onHit(): void {
    if (!this.alive) return;
    this.alive = false;
    this.cameras.main.flash(300, 255, 0, 0);
    this.hpText.setText("HP: ✕").setColor("#ff0000");
    this.time.delayedCall(400, () => this.showEndScreen(false));
  }

  // ----------------------------------------------------------
  // onVictory – player survived 60 s
  // ----------------------------------------------------------
  private onVictory(): void {
    if (this.gameFinished) return;
    this.gameFinished = true;
    this.alive        = false;
    this.cameras.main.flash(400, 255, 255, 255);
    this.time.delayedCall(500, () => this.showEndScreen(true));
  }

  // ----------------------------------------------------------
  // showEndScreen
  // ----------------------------------------------------------
  private showEndScreen(won: boolean): void {
    const { width, height } = this.scale;
    this.clearObstacles();

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

    const heading      = won ? "YOU SURVIVED!" : "GAME OVER";
    const headingColor = won ? "#44ff88"        : "#ff4444";

    this.add.text(width / 2, height * 0.33, heading, {
      fontSize: "44px", color: headingColor,
      fontStyle: "bold", stroke: "#000000", strokeThickness: 5,
    }).setOrigin(0.5);

    const subMsg = won
      ? "คุณผ่านการทดสอบแล้ว!\nศาสตราจารย์ปโยธร ยิ้มพยักหน้าให้คุณ"
      : "คุณยังอธิบายโค้ดไม่ได้\nลองใหม่อีกครั้ง";

    this.add.text(width / 2, height * 0.50, subMsg, {
      fontSize: "18px", color: "#cccccc", align: "center", lineSpacing: 6,
    }).setOrigin(0.5);

    const prompt = this.add.text(width / 2, height * 0.70,
      "Press ENTER to return",
      { fontSize: "16px", color: "#888888" }
    ).setOrigin(0.5);

    this.time.addEvent({
      delay: 600, loop: true,
      callback: () => prompt.setAlpha(prompt.alpha < 0.5 ? 1 : 0.2),
    });

    this.input.keyboard!.once("keydown-ENTER", () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("CampusScene");
      });
    });
  }

  // ----------------------------------------------------------
  // update – every frame
  // ----------------------------------------------------------
  update(_time: number, delta: number): void {
    if (!this.alive || this.gameFinished) return;

    const dt = delta / 1000;

    // ── Move heart ───────────────────────────────────────────
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.keyA.isDown)  dx -= HEART_SPEED;
    if (this.cursors.right.isDown || this.keyD.isDown)  dx += HEART_SPEED;
    if (this.cursors.up.isDown    || this.keyW.isDown)  dy -= HEART_SPEED;
    if (this.cursors.down.isDown  || this.keyS.isDown)  dy += HEART_SPEED;

    // Diagonal normalisation
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

    this.heartX = Phaser.Math.Clamp(
      this.heartX + dx * dt, BOX_LEFT + HEART_RADIUS, BOX_RIGHT  - HEART_RADIUS
    );
    this.heartY = Phaser.Math.Clamp(
      this.heartY + dy * dt, BOX_TOP  + HEART_RADIUS, BOX_BOTTOM - HEART_RADIUS
    );
    this.heart.setPosition(this.heartX, this.heartY);

    // ── Spawn timer ──────────────────────────────────────────
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      if      (this.currentPhase === 1) { this.spawnPhase1(); this.spawnTimer = P1_INTERVAL; }
      else if (this.currentPhase === 2) { this.spawnPhase2(); this.spawnTimer = P2_INTERVAL; }
      else if (this.currentPhase === 3) { this.spawnPhase3(); this.spawnTimer = P3_INTERVAL; }
    }

    // ── Move obstacles & collision check ─────────────────────
    const toRemove: Phaser.GameObjects.Shape[] = [];

    for (const obs of this.obstacles) {
      const vx = (obs.getData("vx") as number) ?? 0;
      const vy = (obs.getData("vy") as number) ?? 0;
      obs.x += vx * dt;
      obs.y += vy * dt;

      // Remove when the obstacle leaves the battle box area
      const hw = obs.width  / 2;
      const hh = obs.height / 2;
      const gone =
        obs.x + hw < BOX_LEFT  - 20 ||
        obs.x - hw > BOX_RIGHT + 20 ||
        obs.y + hh < BOX_TOP   - 20 ||
        obs.y - hh > BOX_BOTTOM + 20;

      if (gone) { toRemove.push(obs); continue; }

      // AABB collision (heart approximated as a small square)
      const hr = HEART_RADIUS - 2; // slight forgiveness
      const hit =
        this.heartX + hr > obs.x - hw &&
        this.heartX - hr < obs.x + hw &&
        this.heartY + hr > obs.y - hh &&
        this.heartY - hr < obs.y + hh;

      if (hit) { this.onHit(); return; }
    }

    for (const obs of toRemove) {
      obs.destroy();
      this.obstacles = this.obstacles.filter(o => o !== obs);
    }
  }
}
