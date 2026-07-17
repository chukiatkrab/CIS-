// ============================================================
// scenes/CampusScene.ts
//
// Main gameplay scene – the KKU campus.
//
// ── QUEST SYSTEM (fixed) ─────────────────────────────────────
// All three quests are tracked by a single QuestManager.
// Quest state is NOT stored as loose booleans on the scene.
//
// "All Quests Done!" is only shown when
//   questManager.areAllQuestsCompleted() === true
// which requires EVERY quest to be individually completed.
//
// State is passed between scenes as:
//   { questId: string, passed: boolean }
// CampusScene.init() receives this and calls the appropriate
// QuestManager method.
//
// ── TWO-CAMERA UI SYSTEM ────────────────────────────────────
// Main camera  zoom=3  follows player  → world objects only
// UI camera    zoom=1  fixed           → UI layers only
// ============================================================

import Phaser from "phaser";
import { Player }          from "../player/Player";
import { HUD }             from "../ui/HUD";
import { PauseMenu }       from "../ui/PauseMenu";
import { DialogueBox }     from "../ui/DialogueBox";
import { QuestTrackerUI }  from "../ui/QuestTrackerUI";
import { NPC }             from "../npc/NPC";
import { QuestManager }    from "../systems/QuestManager";
import { MapBuilder, MAP_WIDTH, MAP_HEIGHT, SPAWN_X, SPAWN_Y } from "../systems/MapBuilder";

const CAMERA_ZOOM           = 3.0;
const NOTIFICATION_DURATION = 2500; // ms

// ── Data passed back from any minigame ────────────────────────
// questId  – which quest this result belongs to
// passed   – did the player win?
interface CampusSceneData {
  questId?: string;
  passed?:  boolean;
}

export class CampusScene extends Phaser.Scene {

  // ── World ─────────────────────────────────────────────────
  private player!: Player;

  // ── Cameras ───────────────────────────────────────────────
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;

  // ── UI ────────────────────────────────────────────────────
  private hud!:            HUD;
  private pauseMenu!:      PauseMenu;
  private dialogueBox!:    DialogueBox;
  private questTrackerUI!: QuestTrackerUI;
  private notification!:   Phaser.GameObjects.Text;

  // ── Quest system (single source of truth) ─────────────────
  // ALL quest state lives here — no loose booleans on the scene.
  private questManager!: QuestManager;

  // ── NPCs ──────────────────────────────────────────────────
  private professor!: NPC;
  private librarian!: NPC;
  private coach!:     NPC;
  private payothorn?: NPC; // Final Boss NPC – only exists after all quests done

  // Which NPC has an open dialogue (null = none)
  private activeNPC: "professor" | "librarian" | "coach" | "payothorn" | null = null;

  // ── Input ─────────────────────────────────────────────────
  private escKey!:   Phaser.Input.Keyboard.Key;
  private keyE!:     Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;

  // ── State ─────────────────────────────────────────────────
  private isTransitioning = false;
  private questData: CampusSceneData | null = null;

  constructor() { super("CampusScene"); }

  // ----------------------------------------------------------
  // init
  // Receives { questId, passed } from any minigame scene.
  // ----------------------------------------------------------
  init(data: CampusSceneData): void {
    this.questData = Object.keys(data).length > 0 ? data : null;
  }

  // ----------------------------------------------------------
  // create
  // ----------------------------------------------------------
  create(): void {
    this.isTransitioning = false;
    this.activeNPC       = null;

    // ── 1. Tilemap ────────────────────────────────────────────
    const { objectLayer } = MapBuilder.build(this);

    // ── 2. Player ─────────────────────────────────────────────
    this.player = new Player(this, SPAWN_X, SPAWN_Y);
    this.player.setDepth(5);

    // ── 3. Tile collision ─────────────────────────────────────
    this.physics.add.collider(this.player, objectLayer);

    // ── 4. Main camera ────────────────────────────────────────
    this.setupMainCamera();

    // ── 5. UI camera ──────────────────────────────────────────
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCamera.setZoom(1);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.ignore(this.children.list.slice());
    this.scale.on("resize", (gs: Phaser.Structs.Size) => {
      this.uiCamera.setSize(gs.width, gs.height);
    });

    // ── 6. Quest manager ──────────────────────────────────────
    // Use a shared instance stored in Phaser's registry so quest
    // progress persists across scene transitions.
    // If no instance exists yet (first time), create one.
    if (!this.registry.has("questManager")) {
      this.registry.set("questManager", new QuestManager());
    }
    this.questManager = this.registry.get("questManager") as QuestManager;
    
    this.applyQuestData(); // restore from returned minigame data

    // ── 7. NPCs ───────────────────────────────────────────────
    this.buildNPCs();

    // ── 8. Dialogue box ───────────────────────────────────────
    this.dialogueBox = new DialogueBox(this);

    // ── 9. Notification banner ────────────────────────────────
    const notifLayer = this.add.layer();
    notifLayer.setDepth(110);
    this.cameras.main.ignore(notifLayer);

    this.notification = this.add.text(
      this.scale.width / 2, this.scale.height * 0.38, "",
      {
        fontSize: "22px", color: "#44ff88", fontStyle: "bold",
        stroke: "#000000", strokeThickness: 4,
        backgroundColor: "#00000099", padding: { x: 18, y: 10 },
      }
    ).setOrigin(0.5).setVisible(false);
    notifLayer.add(this.notification);

    // ── 10. HUD ───────────────────────────────────────────────
    this.hud = new HUD(this);
    this.refreshHUD();

    // ── 11. Quest tracker panel ───────────────────────────────
    // Shows ✓ / ► / - for all three quests, top-right corner.
    this.questTrackerUI = new QuestTrackerUI(this, this.questManager);

    // ── 12. Pause menu ────────────────────────────────────────
    this.pauseMenu = new PauseMenu(this, () => {
      this.scene.start("MainMenuScene");
    });

    // ── 13. Input keys ────────────────────────────────────────
    this.escKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyE     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // ── 14. Fade in ───────────────────────────────────────────
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── 15. Return notification ───────────────────────────────
    this.showReturnNotification();
  }

  // ----------------------------------------------------------
  // applyQuestData
  //
  // Reads the data returned by the last minigame and updates
  // the QuestManager accordingly.
  //
  // KEY FIX: each quest is updated INDEPENDENTLY.
  // Completing quest 3 does NOT affect quests 1 or 2.
  // "All Quests Done" is gated behind areAllQuestsCompleted().
  // ----------------------------------------------------------
  private applyQuestData(): void {
    if (!this.questData) return;

    const { questId, passed } = this.questData;
    if (!questId) return;

    if (passed) {
      // completeQuest() only succeeds if the quest was "in_progress".
      // If a player somehow returns a completion for a quest they
      // never started (skipped), this call is a no-op — the quest
      // stays "not_started" and "All Quests Done" cannot trigger.
      this.questManager.completeQuest(questId);
    } else {
      // Failed attempt — quest stays "in_progress" (already started)
      // so the player can retry.
      this.questManager.startQuest(questId); // ensure it's at least started
    }
  }

  // ----------------------------------------------------------
  // buildNPCs
  //
  // Creates all three NPC objects and applies any post-quest
  // dialogue updates from the QuestManager.
  // ----------------------------------------------------------
  private buildNPCs(): void {
    // ── Professor (quest q1_click) ────────────────────────────
    this.professor = new NPC(this, 300, 100, "Professor", [
      "Welcome to the Computer Laboratory.",
      "Today's assignment is to complete a reaction training exercise.",
    ]);

    if (this.questManager.getStatus("q1_click") === "completed") {
      this.professor.dialogue = ["Excellent work! Click Challenge complete."];
    }

    // ── Librarian (quest q2_rhythm) ───────────────────────────
    this.librarian = new NPC(this, 180, 100, "Librarian", [
      "Welcome to the Library.",
      "Can you complete the Rhythm Arrow challenge?",
      "Follow the arrow sequence shown on screen!",
    ]);

    if (this.questManager.getStatus("q2_rhythm") === "completed") {
      this.librarian.dialogue = ["Amazing rhythm! Rhythm Arrow complete."];
    }

    // ── Coach (quest q3_reaction) ─────────────────────────────
    this.coach = new NPC(this, 60, 100, "Coach", [
      "สวัสดีครับผม ผมโค้ชเองนะครับบบ",
      "Test your reflexes with the Reaction Popup challenge!",
      "Press LEFT or RIGHT to match the arrow — as fast as you can!",
    ]);

    if (this.questManager.getStatus("q3_reaction") === "completed") {
      this.coach.dialogue = ["Outstanding reflexes! Reaction Popup complete."];
    }

    // ── ศาสตราจารย์ปโยธร – Final Boss NPC ──────────────────────
    // ONLY created once all three quests are completed.
    // Before that the boss is hidden — the player must earn the encounter.
    //
    // Condition: questManager.areAllQuestsCompleted()
    //   • true  → spawn the boss NPC in the centre of the map,
    //             larger scale (2×) with a gold glow name tag
    //   • false → skip entirely; this.payothorn stays undefined,
    //             and the update() proximity checks are guarded
    if (this.questManager.areAllQuestsCompleted()) {
      // Centre of the map (world px) — stands out from the edge NPCs
      this.payothorn = new NPC(
        this, 220, 60,
        "ศาสตราจารย์ปโยธร (Payothorn Urathumkul)",
        ["ถ้าให้คุณอธิบายโค้ดทั้งหมดที่คุณทำมา คุณทำได้ไหม?"]
      );
      // 2× scale makes the boss clearly bigger than any other NPC
      this.payothorn.setScale(2.0);
    }
  }

  // ----------------------------------------------------------
  // setupMainCamera
  // ----------------------------------------------------------
  private setupMainCamera(): void {
    const cam = this.cameras.main;
    cam.setZoom(CAMERA_ZOOM);
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    cam.startFollow(this.player, true, 0.1, 0.1);
  }

  // ----------------------------------------------------------
  // refreshHUD
  //
  // Shows the name of the currently active quest,
  // or "All Quests Done!" ONLY when every quest is completed.
  // ----------------------------------------------------------
  private refreshHUD(): void {
    // ── FIXED: check ALL quests, not just one ─────────────────
    if (this.questManager.areAllQuestsCompleted()) {
      this.hud.updateMission("All Quests Done!");
      return;
    }

    // Show the name of whichever quest is currently active
    const active = this.questManager.getActiveQuest();
    if (active) {
      const prefix = active.status === "in_progress" ? "" : "Next: ";
      this.hud.updateMission(prefix + active.name);
    } else {
      this.hud.updateMission("No active quest");
    }
  }

  // ----------------------------------------------------------
  // showNotification
  // ----------------------------------------------------------
  private showNotification(message: string, color: string): void {
    this.notification.setText(message).setColor(color).setVisible(true);
    this.time.delayedCall(NOTIFICATION_DURATION, () => {
      this.notification.setVisible(false);
    });
  }

  // ----------------------------------------------------------
  // showReturnNotification
  // Displays a contextual banner based on what the player just did.
  // ----------------------------------------------------------
  private showReturnNotification(): void {
    if (!this.questData?.questId) return;

    const { questId, passed } = this.questData;
    const quest = this.questManager.getQuest(questId);
    const name  = quest?.name ?? questId;

    if (passed) {
      if (this.questManager.areAllQuestsCompleted()) {
        this.showNotification("🎉 All Quests Complete!", "#f5c518");
      } else {
        this.showNotification(`${name} — Complete!`, "#44ff88");
      }
    } else {
      this.showNotification(`${name} — Try again!`, "#ffaa44");
    }
  }

  // ----------------------------------------------------------
  // openDialogue (generic helper)
  // ----------------------------------------------------------
  private openDialogue(
    npc: NPC,
    npcKey: "professor" | "librarian" | "coach",
    questId: string,
    sceneKey: string
  ): void {
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.activeNPC = npcKey;

    const status = this.questManager.getStatus(questId);
    const text   = npc.dialogue.join("\n\n");

    let hints: string;
    if (status === "completed") {
      hints = "[ESC]  Close";
    } else if (status === "in_progress") {
      hints = "[ENTER]  Start Minigame          [ESC]  Leave";
    } else {
      hints = "[ENTER]  Accept Quest          [ESC]  Leave";
    }

    this.dialogueBox.open(npc.name, text, hints);
  }

  // ----------------------------------------------------------
  // handleDialogueEnter (generic helper)
  // ----------------------------------------------------------
  private handleDialogueEnter(questId: string, sceneKey: string): void {
    const status = this.questManager.getStatus(questId);

    // ── If quest is completed, don't allow replay ───────────
    if (status === "completed") {
      this.closeDialogue();
      const questName = this.questManager.getQuest(questId)?.name ?? "Quest";
      this.showNotification(`${questName} already completed!`, "#44ff88");
      return;
    }

    if (status === "in_progress") {
      // Already accepted — go straight to minigame
      this.closeDialogue();
      this.launchScene(sceneKey, questId);
      return;
    }

    // "not_started" — accept the quest now
    this.questManager.startQuest(questId);
    this.closeDialogue();
    this.refreshHUD();
    this.questTrackerUI.refresh();
    this.showNotification(`Quest Accepted: ${this.questManager.getQuest(questId)?.name}`, "#44ff88");
    this.time.delayedCall(1000, () => this.launchScene(sceneKey, questId));
  }

  // ----------------------------------------------------------
  // openPayothornDialogue
  // Shows Payothorn's challenge question with two choices
  // (No / NO) — both of which launch the boss fight.
  // ----------------------------------------------------------
  private openPayothornDialogue(): void {
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.activeNPC = "payothorn";

    const text  = this.payothorn!.dialogue.join("\n\n");
    // Both options lead to the same outcome — a fun Undertale nod
    const hints = "[ENTER]  No          [ESC]  NO";

    this.dialogueBox.open(this.payothorn!.name, text, hints);
  }

  // ----------------------------------------------------------
  // handlePayothornEnter
  // Called when ENTER is pressed in Payothorn's dialogue.
  // Both choices ("No" and the ESC "NO" override) start the
  // boss fight — so we override ESC in the update loop too.
  // ----------------------------------------------------------
  private handlePayothornEnter(): void {
    this.closeDialogue();
    this.launchScene("BossFightScene", "");
  }

  // ----------------------------------------------------------
  // closeDialogue
  // ----------------------------------------------------------
  private closeDialogue(): void {
    this.dialogueBox.close();
    this.physics.resume();
    this.activeNPC = null;
  }

  // ----------------------------------------------------------
  // launchScene
  //
  // Fades out and starts a minigame scene.
  // questId is stored so the minigame can return it to us.
  // Each minigame already returns { questId, passed } — the
  // scene key names in each minigame file are updated below.
  // ----------------------------------------------------------
  private launchScene(sceneKey: string, _questId: string): void {
    this.isTransitioning = true;
    this.physics.pause();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(sceneKey);
    });
  }

  // ----------------------------------------------------------
  // update – every frame
  // ----------------------------------------------------------
  update(): void {
    if (this.isTransitioning) return;

    // While dialogue is open: only ENTER / ESC
    if (this.dialogueBox.isOpen()) {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        if (this.activeNPC === "professor") {
          this.handleDialogueEnter("q1_click",    "ClickChallengeScene");
        } else if (this.activeNPC === "librarian") {
          this.handleDialogueEnter("q2_rhythm",   "RhythmArrowScene");
        } else if (this.activeNPC === "coach") {
          this.handleDialogueEnter("q3_reaction", "ReactionPopupScene");
        } else if (this.activeNPC === "payothorn") {
          // Both "No" and "NO" start the boss fight
          this.handlePayothornEnter();
        }
      } else if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
        this.closeDialogue();
      }
      return;
    }

    // Normal gameplay
    this.player.update();

    const nearProf  = this.professor.isNearPlayer(this.player);
    const nearLib   = this.librarian.isNearPlayer(this.player);
    const nearCoach = this.coach.isNearPlayer(this.player);

    this.professor.showPrompt(nearProf);
    this.librarian.showPrompt(nearLib);
    this.coach.showPrompt(nearCoach);
    // payothorn only exists after all quests are completed
    if (this.payothorn) {
      this.payothorn.showPrompt(this.payothorn.isNearPlayer(this.player));
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      if (nearProf)  {
        this.openDialogue(this.professor, "professor", "q1_click",    "ClickChallengeScene");
        return;
      }
      if (nearLib)   {
        this.openDialogue(this.librarian, "librarian", "q2_rhythm",   "RhythmArrowScene");
        return;
      }
      if (nearCoach) {
        this.openDialogue(this.coach,     "coach",     "q3_reaction", "ReactionPopupScene");
        return;
      }
      // Payothorn – standalone boss NPC (only exists after all quests done)
      if (this.payothorn && this.payothorn.isNearPlayer(this.player)) {
        this.openPayothornDialogue();
        return;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.pauseMenu.toggle();
    }
  }
}
