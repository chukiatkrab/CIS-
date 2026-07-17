// ============================================================
// systems/QuestManager.ts
//
// Single source of truth for ALL quest progress.
//
// ── WHY THE OLD SYSTEM BROKE ────────────────────────────────
// The previous system tracked quests with a mix of:
//   - A QuestManager class that only knew about quest 1
//   - Loose boolean fields (lib2Done, coach3Accepted …) on
//     CampusScene itself
//
// Because there was no central record, "All Quests Done" was
// triggered by checking only ONE boolean (coach3Done) without
// verifying the others.  Completing quest 3 first incorrectly
// showed "All Quests Done!" even though quests 1 and 2 were
// untouched.
//
// ── HOW THIS VERSION FIXES IT ────────────────────────────────
// Every quest is stored as a QuestEntry with its own:
//   id          – unique string key
//   name        – short display name
//   description – longer explanation shown in the tracker UI
//   status      – "not_started" | "in_progress" | "completed"
//
// "All Quests Done" is only true when EVERY quest's status
// is "completed" — checked by areAllQuestsCompleted().
//
// CampusScene calls this class for all three quests instead of
// keeping its own loose booleans.
// ============================================================

// ── Quest status type ────────────────────────────────────────
export type QuestStatus = "not_started" | "in_progress" | "completed";

// ── Quest data shape ─────────────────────────────────────────
export interface QuestEntry {
  id:          string;      // unique key, e.g. "q1_click"
  name:        string;      // short label shown in tracker
  description: string;      // what the player must do
  status:      QuestStatus;
}

export class QuestManager {
  // The quest list.  Order matters — used by the tracker UI.
  private quests: QuestEntry[] = [
    {
      id:          "q1_click",
      name:        "Click Challenge",
      description: "Talk to the Professor and complete the Click Challenge minigame.",
      status:      "not_started",
    },
    {
      id:          "q2_rhythm",
      name:        "Rhythm Arrow",
      description: "Talk to the Librarian and complete the Rhythm Arrow challenge.",
      status:      "not_started",
    },
    {
      id:          "q3_reaction",
      name:        "Reaction Popup",
      description: "๋Hi858 858585",
      status:      "not_started",
    },
  ];

  // ----------------------------------------------------------
  // getQuest
  // Returns the QuestEntry for a given id, or undefined.
  // ----------------------------------------------------------
  getQuest(id: string): QuestEntry | undefined {
    return this.quests.find(q => q.id === id);
  }

  // ----------------------------------------------------------
  // getAllQuests
  // Returns a copy of the full quest list (safe to iterate).
  // ----------------------------------------------------------
  getAllQuests(): QuestEntry[] {
    return [...this.quests];
  }

  // ----------------------------------------------------------
  // getStatus
  // Convenience: returns the status of one quest by id.
  // ----------------------------------------------------------
  getStatus(id: string): QuestStatus {
    return this.getQuest(id)?.status ?? "not_started";
  }

  // ----------------------------------------------------------
  // startQuest
  // Moves a quest from "not_started" → "in_progress".
  // Safe to call even if the quest is already in_progress.
  // ----------------------------------------------------------
  startQuest(id: string): void {
    const q = this.getQuest(id);
    if (q && q.status === "not_started") {
      q.status = "in_progress";
      console.log(`[QuestManager] "${q.name}" started.`);
    }
  }

  // ----------------------------------------------------------
  // completeQuest
  // Moves a quest to "completed".
  // Only marks it complete if it was previously in_progress.
  // This prevents a quest from being marked complete without
  // ever being started, which was the source of the old bug.
  // ----------------------------------------------------------
  completeQuest(id: string): void {
    const q = this.getQuest(id);
    if (q && q.status === "in_progress") {
      q.status = "completed";
      console.log(`[QuestManager] "${q.name}" completed.`);
    }
  }

  // ----------------------------------------------------------
  // areAllQuestsCompleted
  //
  // Returns true ONLY when every quest has status "completed".
  // This is the only correct way to check for "All Quests Done".
  //
  // Previously the code checked a single boolean (coach3Done)
  // which could be true while the other quests were still
  // "not_started".  This method removes that possibility.
  // ----------------------------------------------------------
  areAllQuestsCompleted(): boolean {
    return this.quests.every(q => q.status === "completed");
  }

  // ----------------------------------------------------------
  // getActiveQuest
  //
  // Returns the first quest that is "in_progress", or the first
  // "not_started" quest if none is active.
  // Used by the HUD to display the current mission.
  // ----------------------------------------------------------
  getActiveQuest(): QuestEntry | null {
    return (
      this.quests.find(q => q.status === "in_progress") ??
      this.quests.find(q => q.status === "not_started") ??
      null
    );
  }

  // ── Legacy helpers kept for backward compatibility ────────
  // CampusScene used these for quest 1.  They now delegate to
  // the new generic methods so nothing breaks.

  acceptReactionQuest(): void  { this.startQuest("q1_click"); }
  completeReactionQuest(): void { this.completeQuest("q1_click"); }

  getReactionQuestState(): "inactive" | "accepted" | "completed" {
    const s = this.getStatus("q1_click");
    if (s === "not_started") return "inactive";
    if (s === "in_progress") return "accepted";
    return "completed";
  }
}
