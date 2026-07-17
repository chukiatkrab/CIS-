# 📚 คู่มือเข้าใจและแก้ไขเกม Campus Adventure

## 🎮 ภาพรวมของเกม

เกมนี้เป็นเกมผจญภัยในมหาวิทยาลัย ที่ผู้เล่นจะต้องเดินไปคุยกับ NPC (ตัวละครที่ไม่ใช่ผู้เล่น) 3 คน และทำมินิเกมให้สำเร็จ

### ขั้นตอนการเล่น
1. **เดินไปหา NPC** - ใช้ปุ่มลูกศรเดิน
2. **กด E เพื่อคุย** - เมื่ออยู่ใกล้ NPC
3. **กด ENTER รับเควส** - ยอมรับภารกิจ
4. **เล่นมินิเกม** - ทำภารกิจให้สำเร็จ
5. **ดูผลลัพธ์** - ดู Score, Accuracy, Rank
6. **ทำครบ 3 เควส** - ปลดล็อกบอสลับ

---

## 👥 ตัวละคร (NPC)

### ไฟล์: `src/npc/NPC.ts`

#### NPC คืออะไร?
NPC ย่อมาจาก "Non-Player Character" คือตัวละครในเกมที่ไม่ใช่ผู้เล่นควบคุม เช่น ศาสตราจารย์ บรรณารักษ์ โค้ช

#### NPC ในเกมมี 3 คน:
1. **Professor (ศาสตราจารย์)** - ให้เควส Click Challenge
2. **Librarian (บรรณารักษ์)** - ให้เควส Rhythm Arrow  
3. **Coach (โค้ช)** - ให้เควส Reaction Popup

---

### 🔧 วิธีแก้ไข NPC

#### 1. เปลี่ยนตำแหน่ง NPC
**ไฟล์:** `src/scenes/CampusScene.ts` (ประมาณบรรทัด 200-230)

```typescript
// ตัวอย่าง: ย้ายศาสตราจารย์
this.professor = new NPC(this, 300, 100, "Professor", [...]);
//                              ^^^  ^^^
//                               X    Y  (หน่วยเป็น pixel)
```

**วิธีเปลี่ยน:**
- เปลี่ยนตัวเลข `300` = เลื่อนซ้าย-ขวา (เพิ่มเลข = ไปขวา, ลดเลข = ไปซ้าย)
- เปลี่ยนตัวเลข `100` = เลื่อนบน-ล่าง (เพิ่มเลข = ไปล่าง, ลดเลข = ไปบน)

**ตัวอย่าง:**
```typescript
// เดิม
this.professor = new NPC(this, 300, 100, "Professor", [...]);

// ย้ายไปขวาและลงล่าง
this.professor = new NPC(this, 400, 150, "Professor", [...]);
```

---

#### 2. เปลี่ยนชื่อ NPC
```typescript
this.professor = new NPC(this, 300, 100, "อาจารย์ประจำวิชา", [...]);
//                                       ^^^^^^^^^^^^^^^^^^
//                                       ชื่อที่จะแสดง
```

---

#### 3. เปลี่ยนบทสนทนา NPC
```typescript
this.professor = new NPC(this, 300, 100, "Professor", [
  "ยินดีต้อนรับสู่ห้องปฏิบัติการคอมพิวเตอร์",  // ประโยคที่ 1
  "วันนี้เราจะมาเทสท์ความเร็วของคุณกันครับ",   // ประโยคที่ 2
]);
```

**หมายเหตุ:** ทุกประโยคใน `[...]` จะแสดงในกล่องข้อความ คั่นด้วย 2 บรรทัด

---

#### 4. เปลี่ยนขนาด NPC
```typescript
this.professor.setScale(1.5); // ขยาย 1.5 เท่า (150%)
this.professor.setScale(0.8); // ย่อเหลือ 0.8 เท่า (80%)
```

---

## 🎯 มินิเกมทั้ง 3

### 1️⃣ Click Challenge (กดวงกลม)

**ไฟล์:** `src/scenes/ClickChallengeScene.ts`

#### เกมนี้คืออะไร?
- วงกลมสีสุ่มจะโผล่ขึ้นมาทีละอัน
- ผู้เล่นต้องคลิกให้ได้มากที่สุดภายใน 20 วินาที
- ได้ ≥ 15 ครั้ง = ผ่าน

---

### 🔧 วิธีแก้ไข Click Challenge

#### เปลี่ยนเวลาเล่น (บรรทัด 45-46)
```typescript
const GAME_DURATION = 20;  // วินาที (เพิ่มเลขได้)
```
**ตัวอย่าง:**
```typescript
const GAME_DURATION = 30;  // เพิ่มเป็น 30 วินาที
```

---

#### เปลี่ยนเกณฑ์ผ่าน (บรรทัด 46)
```typescript
const WIN_SCORE = 15;  // ต้องคลิกได้ 15 ครั้ง
```
**ตัวอย่าง:**
```typescript
const WIN_SCORE = 10;  // ลดเหลือ 10 ครั้งก็ผ่าน (ง่ายขึ้น)
const WIN_SCORE = 20;  // เพิ่มเป็น 20 ครั้ง (ยากขึ้น)
```

---

#### เปลี่ยนขนาดวงกลม (บรรทัด 47-48)
```typescript
const CIRCLE_MIN_R = 24;  // รัศมีเล็กสุด (pixel)
const CIRCLE_MAX_R = 44;  // รัศมีใหญ่สุด (pixel)
```
**ตัวอย่าง:**
```typescript
const CIRCLE_MIN_R = 35;  // เพิ่มขนาดเล็กสุด (ง่ายขึ้น)
const CIRCLE_MAX_R = 60;  // เพิ่มขนาดใหญ่สุด (ง่ายขึ้น)
```

---

#### เปลี่ยนสีวงกลม (บรรทัด 52-58)
```typescript
const CIRCLE_COLORS = [
  0xff4444, // สีแดง
  0x4488ff, // สีน้ำเงิน
  0xffcc00, // สีเหลือง
  0x44cc44, // สีเขียว
  0xff88ff, // สีชมพู
];
```
**เพิ่มสีใหม่:**
```typescript
const CIRCLE_COLORS = [
  0xff4444, // สีแดง
  0x4488ff, // สีน้ำเงิน
  0xffcc00, // สีเหลือง
  0x44cc44, // สีเขียว
  0xff88ff, // สีชมพู
  0xff9900, // สีส้ม (เพิ่มใหม่)
  0x9966ff, // สีม่วง (เพิ่มใหม่)
];
```

**หมายเหตุ:** รหัสสี `0xRRGGBB`
- RR = Red (แดง) 00-FF
- GG = Green (เขียว) 00-FF
- BB = Blue (น้ำเงิน) 00-FF

---

### 2️⃣ Rhythm Arrow (กดลูกศรตามจังหวะ)

**ไฟล์:** `src/scenes/RhythmArrowScene.ts`

#### เกมนี้คืออะไร?
- จะมีลูกศร (↑ ↓ ← →) แสดงเป็นลำดับ
- ผู้เล่นต้องกดปุ่มลูกศรให้ตรงตามลำดับก่อนเวลาหมด
- ต้องผ่าน 3 รอบจึงจะชนะ

---

### 🔧 วิธีแก้ไข Rhythm Arrow

#### เปลี่ยนจำนวนรอบที่ต้องผ่าน (บรรทัด 51)
```typescript
const ROUNDS_TO_WIN = 3;  // ต้องผ่าน 3 รอบ
```
**ตัวอย่าง:**
```typescript
const ROUNDS_TO_WIN = 2;  // ลดเหลือ 2 รอบ (ง่ายขึ้น)
const ROUNDS_TO_WIN = 5;  // เพิ่มเป็น 5 รอบ (ยากขึ้น)
```

---

#### เปลี่ยนจำนวนครั้งที่ทำผิดได้ (บรรทัด 52)
```typescript
const MAX_FAILS = 2;  // ทำผิดได้ 2 ครั้ง
```
**ตัวอย่าง:**
```typescript
const MAX_FAILS = 3;  // ทำผิดได้ 3 ครั้ง (ง่ายขึ้น)
const MAX_FAILS = 1;  // ทำผิดได้แค่ 1 ครั้ง (ยากขึ้น)
```

---

#### เปลี่ยนคะแนน (บรรทัด 53-54)
```typescript
const SCORE_CORRECT = 10;   // กดถูก +10 คะแนน
const SCORE_WRONG   = -5;   // กดผิด -5 คะแนน
```
**ตัวอย่าง:**
```typescript
const SCORE_CORRECT = 20;   // เพิ่มเป็น +20 คะแนน
const SCORE_WRONG   = -10;  // เพิ่มเป็น -10 คะแนน (โหดขึ้น)
```

---

#### เปลี่ยนความยากของแต่ละรอบ
**ไฟล์:** `src/minigames/ArrowSequenceGenerator.ts` (บรรทัด 15-34)

```typescript
// รอบที่ 1-2: ง่าย
{ arrowCount: 4, timePerKey: 1200 }  // 4 ลูกศร, กดต่อครั้งได้ 1.2 วินาที

// รอบที่ 3-4: ปานกลาง
{ arrowCount: 6, timePerKey: 1000 }  // 6 ลูกศร, กดต่อครั้งได้ 1.0 วินาที

// รอบที่ 5+: ยาก
{ arrowCount: 8, timePerKey: 800 }   // 8 ลูกศร, กดต่อครั้งได้ 0.8 วินาที
```

**ตัวอย่างทำให้ง่ายขึ้น:**
```typescript
// รอบที่ 1-2: ง่ายมาก
{ arrowCount: 3, timePerKey: 1500 }  // 3 ลูกศร, 1.5 วินาที

// รอบที่ 3-4: ง่าย
{ arrowCount: 4, timePerKey: 1300 }  // 4 ลูกศร, 1.3 วินาที

// รอบที่ 5+: ปานกลาง
{ arrowCount: 5, timePerKey: 1000 }  // 5 ลูกศร, 1.0 วินาที
```

---

### 3️⃣ Reaction Popup (กดลูกศรตามที่การ์ดแสดง)

**ไฟล์:** `src/scenes/ReactionPopupScene.ts`

#### เกมนี้คืออะไร?
- การ์ดจะไถลเข้ามาจากซ้ายหรือขวา แสดงลูกศร ← หรือ →
- ผู้เล่นต้องกดปุ่มลูกศรให้ตรงก่อนเวลาหมด
- มี 10 รอบ ต้องถูก ≥ 7 ครั้ง จึงจะผ่าน

---

### 🔧 วิธีแก้ไข Reaction Popup

#### เปลี่ยนจำนวนรอบ (บรรทัด 47)
```typescript
const TOTAL_ROUNDS = 10;  // เล่น 10 รอบ
```
**ตัวอย่าง:**
```typescript
const TOTAL_ROUNDS = 15;  // เพิ่มเป็น 15 รอบ
const TOTAL_ROUNDS = 8;   // ลดเหลือ 8 รอบ
```

---

#### เปลี่ยนเกณฑ์ผ่าน (บรรทัด 48)
```typescript
const WIN_THRESHOLD = 7;  // ต้องถูก 7 ครั้ง จาก 10
```
**ตัวอย่าง:**
```typescript
const WIN_THRESHOLD = 5;  // ลดเหลือ 5 ครั้ง (ง่ายขึ้น)
const WIN_THRESHOLD = 9;  // เพิ่มเป็น 9 ครั้ง (ยากขึ้น)
```

---

#### เปลี่ยนเวลาตอบสนอง (บรรทัด 51-53)
```typescript
const TIME_EASY   = 2000; // รอบ 1-3: 2.0 วินาที
const TIME_MEDIUM = 1500; // รอบ 4-7: 1.5 วินาที
const TIME_HARD   = 1000; // รอบ 8-10: 1.0 วินาที
```

**ตัวอย่างทำให้ง่ายขึ้น:**
```typescript
const TIME_EASY   = 2500; // 2.5 วินาที (ง่ายมาก)
const TIME_MEDIUM = 2000; // 2.0 วินาที
const TIME_HARD   = 1500; // 1.5 วินาที
```

**ตัวอย่างทำให้ยากขึ้น:**
```typescript
const TIME_EASY   = 1500; // 1.5 วินาที
const TIME_MEDIUM = 1000; // 1.0 วินาที
const TIME_HARD   = 700;  // 0.7 วินาที (โหด!)
```

---

#### เปลี่ยนสีการ์ด (บรรทัด 200-201)
```typescript
const color = dir === "LEFT" ? 0x1144aa : 0xaa4411;
//                             ^^^^^^^^   ^^^^^^^^
//                             สีซ้าย      สีขวา
```

**ตัวอย่าง:**
```typescript
// เปลี่ยนสีซ้ายเป็นเขียว, สีขวาเป็นแดง
const color = dir === "LEFT" ? 0x00ff00 : 0xff0000;
```

---

## 🏆 หน้าผลลัพธ์ (Result Screen)

**ไฟล์:** `src/scenes/ResultScene.ts`

### หน้านี้แสดงอะไร?
- **Score** (คะแนน) - คะแนนรวมที่ได้
- **Accuracy** (ความแม่นยำ) - เปอร์เซ็นต์ที่ทำถูก
- **Rank** (อันดับ) - S, A, B, C, หรือ D

---

### 🔧 วิธีแก้ไข Result Screen

#### เปลี่ยนสีอันดับ (บรรทัด 137-143)
```typescript
const rankColor: Record<string, string> = {
  S: "#ffd700",  // ทอง
  A: "#44ff88",  // เขียว
  B: "#44aaff",  // น้ำเงิน
  C: "#ffaa44",  // ส้ม
  D: "#ff4444",  // แดง
};
```

**ตัวอย่าง:**
```typescript
const rankColor: Record<string, string> = {
  S: "#ff00ff",  // ม่วง (เปลี่ยนสี S)
  A: "#00ffff",  // ฟ้าสด
  B: "#ffff00",  // เหลืองสด
  C: "#ff8800",  // ส้มเข้ม
  D: "#880000",  // แดงเข้ม
};
```

---

#### เปลี่ยนเกณฑ์อันดับของแต่ละเกม

**Click Challenge** - `src/scenes/ClickChallengeScene.ts` (บรรทัด 148-153)
```typescript
// การคำนวณอันดับ
let rank = "D";
if (this.score >= 18) rank = "S";       // 18+ = S
else if (this.score >= WIN_SCORE) rank = "A";  // 15+ = A
else if (this.score >= 12) rank = "B";  // 12+ = B
else if (this.score >= 8) rank = "C";   // 8+ = C
// ต่ำกว่า 8 = D
```

**ตัวอย่างทำให้ง่ายขึ้น:**
```typescript
let rank = "D";
if (this.score >= 15) rank = "S";       // ลดเกณฑ์
else if (this.score >= 12) rank = "A";
else if (this.score >= 9) rank = "B";
else if (this.score >= 6) rank = "C";
```

---

**Rhythm Arrow** - `src/scenes/RhythmArrowScene.ts` (บรรทัด 270-274)
```typescript
let rank = "D";
if (this.roundsPassed >= ROUNDS_TO_WIN && this.score >= 80) rank = "S";
else if (this.roundsPassed >= ROUNDS_TO_WIN) rank = "A";
else if (this.roundsPassed >= 2) rank = "B";
else if (this.roundsPassed >= 1) rank = "C";
```

---

**Reaction Popup** - `src/scenes/ReactionPopupScene.ts` (บรรทัด 238-242)
```typescript
let rank = "D";
if (this.correctCount >= 9) rank = "S";              // 9+ = S
else if (this.correctCount >= WIN_THRESHOLD) rank = "A"; // 7+ = A
else if (this.correctCount >= 5) rank = "B";         // 5+ = B
else if (this.correctCount >= 3) rank = "C";         // 3+ = C
```

---

## 🗺️ แผนที่และการเคลื่อนไหว

### การตั้งค่าผู้เล่น

**ไฟล์:** `src/player/Player.ts`

#### เปลี่ยนความเร็วผู้เล่น (บรรทัด ~20)
```typescript
const PLAYER_SPEED = 80;  // ความเร็ว (pixel/วินาที)
```

**ตัวอย่าง:**
```typescript
const PLAYER_SPEED = 120;  // วิ่งเร็วขึ้น
const PLAYER_SPEED = 50;   // วิ่งช้าลง
```

---

## 🎯 ระบบเควส (Quest System)

**ไฟล์:** `src/systems/QuestManager.ts`

### ระบบเควสทำงานอย่างไร?
1. **not_started** - ยังไม่เริ่ม
2. **in_progress** - กำลังทำอยู่ (รับเควสแล้ว)
3. **completed** - เสร็จแล้ว (ผ่านมินิเกม)

---

### เควสทั้ง 3 (บรรทัด 42-62)
```typescript
{
  id: "q1_click",              // รหัสเควส
  name: "Click Challenge",      // ชื่อที่แสดง
  description: "Talk to the Professor...",  // รายละเอียด
  status: "not_started",       // สถานะเริ่มต้น
},
```

---

### 🔧 วิธีแก้ไขเควส

#### เปลี่ยนชื่อเควส
```typescript
{
  id: "q1_click",
  name: "ทดสอบการคลิก",  // เปลี่ยนเป็นภาษาไทย
  description: "คุยกับศาสตราจารย์และทำแบบทดสอบ",
  status: "not_started",
},
```

---

## 📋 สรุปตำแหน่งไฟล์สำคัญ

```
src/
├── npc/
│   └── NPC.ts                    ← ตัวละคร NPC
├── player/
│   └── Player.ts                 ← ผู้เล่น (ความเร็ว, การเคลื่อนไหว)
├── scenes/
│   ├── CampusScene.ts            ← ฉากหลัก (ตำแหน่ง NPC, การจัดการเควส)
│   ├── ClickChallengeScene.ts    ← มินิเกม 1: Click Challenge
│   ├── RhythmArrowScene.ts       ← มินิเกม 2: Rhythm Arrow
│   ├── ReactionPopupScene.ts     ← มินิเกม 3: Reaction Popup
│   └── ResultScene.ts            ← หน้าแสดงผลลัพธ์
├── systems/
│   └── QuestManager.ts           ← ระบบจัดการเควส
└── minigames/
    └── ArrowSequenceGenerator.ts ← ความยาก Rhythm Arrow
```

---

## 🎨 รหัสสีที่ใช้บ่อย

| สี | รหัส Hex |
|---|---|
| แดง | `0xff0000` |
| เขียว | `0x00ff00` |
| น้ำเงิน | `0x0000ff` |
| เหลือง | `0xffff00` |
| ม่วง | `0xff00ff` |
| ฟ้า | `0x00ffff` |
| ส้ม | `0xff8800` |
| ชมพู | `0xff88ff` |
| ขาว | `0xffffff` |
| ดำ | `0x000000` |
| เทา | `0x808080` |

---

## ⚠️ ข้อควรระวัง

### 1. หน่วยเวลา
- `1000` = 1 วินาที (1,000 มิลลิวินาที)
- `2000` = 2 วินาที
- `500` = 0.5 วินาที

### 2. หน่วยความเร็ว
- ตัวเลขยิ่งมาก = เร็วมาก
- `80` = ปกติ
- `120` = เร็ว
- `50` = ช้า

### 3. พิกัด (X, Y)
- `X` = ซ้าย-ขวา (0 = ซ้ายสุด)
- `Y` = บน-ล่าง (0 = บนสุด)

### 4. การบันทึก
- **กดบันทึก (Ctrl+S)** หลังแก้โค้ดทุกครั้ง
- **รันใหม่** เพื่อดูผลการเปลี่ยนแปลง

---

## 🚀 วิธีรันเกมหลังแก้โค้ด

```bash
# 1. Build เกมใหม่
npm run build

# 2. รันเกม
npm run dev
```

---

## 💡 เคล็ดลับ

### ต้องการทำให้เกมง่ายขึ้น?
✅ เพิ่มเวลาในมินิเกม  
✅ ลดเกณฑ์ผ่าน  
✅ ขยายขนาดวงกลม  
✅ เพิ่มจำนวนครั้งที่ทำผิดได้  

### ต้องการทำให้เกมยากขึ้น?
✅ ลดเวลาในมินิเกม  
✅ เพิ่มเกณฑ์ผ่าน  
✅ ย่อขนาดวงกลม  
✅ ลดจำนวนครั้งที่ทำผิดได้  

---

## 📞 คำถามที่พบบ่อย (FAQ)

### Q: แก้โค้ดแล้วเกมไม่เปลี่ยน?
A: ลืมบันทึกไฟล์ หรือลืมรัน `npm run build` ใหม่

### Q: เกมพังหลังแก้โค้ด?
A: เช็คว่าไม่ได้ลบเครื่องหมาย `;` หรือ `}` โดยไม่ตั้งใจ

### Q: อยากเพิ่มมินิเกมใหม่?
A: ต้องสร้างไฟล์ Scene ใหม่ และเชื่อมโยงกับ NPC และ QuestManager

### Q: อยากเพิ่ม NPC คนใหม่?
A: เพิ่มใน `buildNPCs()` ของ `CampusScene.ts` และเพิ่มเควสใหม่ใน `QuestManager.ts`

---

## ✅ Checklist แก้โค้ด

- [ ] เปิดไฟล์ที่ต้องการแก้
- [ ] แก้ค่าตามต้องการ (เช่น เวลา, คะแนน, ตำแหน่ง)
- [ ] **บันทึกไฟล์ (Ctrl+S)**
- [ ] รัน `npm run build`
- [ ] เปิดเกมทดสอบ
- [ ] ถ้าพัง → ย้อนกลับการแก้ไข
- [ ] ถ้าได้ดั่งใจ → เก็บไว้

---

**สุดท้าย:** อย่ากลัวที่จะลองผิดลองถูก! โค้ดสามารถแก้ไขได้เสมอ และคุณสามารถใช้ Git เพื่อย้อนกลับได้ถ้าทำผิดพลาด

**Have Fun! 🎮✨**
