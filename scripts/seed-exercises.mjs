/**
 * Seeds the master exercise library (idempotent).
 * Inserts into EXISTING columns only: name, muscle_group, cues. Video is left
 * empty (never invented). Equipment + category are carried in the data below
 * for a future backfill once those columns are approved — they are NOT written.
 *
 * Safe: additive only. Skips any exercise whose name already exists
 * (case-insensitive), so existing/test exercises and re-runs never duplicate.
 *
 * Run:  node scripts/seed-exercises.mjs
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim().replace(/^"|"$/g, "");
const sql = neon(url);

// [name, muscleGroup, equipment, category, cues]
const LIB = [
  // ── Chest ──────────────────────────────────────────────────────────────
  ["Barbell Bench Press", "Chest", "Barbell", "Horizontal Push", "Retract the shoulder blades\nLower to the mid-chest\nDrive the bar up and slightly back"],
  ["Incline Barbell Bench Press", "Chest", "Barbell", "Horizontal Push", "Set the bench to 30°\nKeep elbows ~45° from the torso\nTouch the upper chest"],
  ["Dumbbell Bench Press", "Chest", "Dumbbell", "Horizontal Push", "Keep wrists stacked over elbows\nLower under control\nPress the dumbbells together at the top"],
  ["Incline Dumbbell Bench Press", "Chest", "Dumbbell", "Horizontal Push", "Bench at 30°\nStretch the chest at the bottom\nDon't clash the dumbbells"],
  ["Machine Chest Press", "Chest", "Machine", "Horizontal Push", "Set the seat so handles align with mid-chest\nPress without locking hard\nControl the return"],
  ["Incline Machine Chest Press", "Chest", "Machine", "Horizontal Push", "Handles at upper-chest height\nDrive up and in\nFeel the stretch on the way back"],
  ["Smith Machine Bench Press", "Chest", "Smith Machine", "Horizontal Push", "Position chest under the bar path\nLower to the sternum\nKeep tension throughout"],
  ["Cable Fly", "Chest", "Cable", "Horizontal Push", "Soft bend in the elbows\nHug the arms together\nSqueeze at the midline"],
  ["Low-to-High Cable Fly", "Chest", "Cable", "Horizontal Push", "Pulleys at the bottom\nSweep up toward the collarbones\nEmphasise the upper chest"],
  ["High-to-Low Cable Fly", "Chest", "Cable", "Horizontal Push", "Pulleys set high\nBring hands down to the hips\nSqueeze the lower chest"],
  ["Incline Cable Fly", "Chest", "Cable", "Horizontal Push", "Bench at 30° between the cables\nWide arc\nStretch and squeeze"],
  ["Pec Deck", "Chest", "Machine", "Horizontal Push", "Align pads with the chest\nDrive elbows together\nHold the squeeze briefly"],
  ["Push-Up", "Chest", "Bodyweight", "Horizontal Push", "Body in a straight line\nElbows ~45°\nFull range to the floor"],
  ["Weighted Push-Up", "Chest", "Bodyweight", "Horizontal Push", "Add load across the upper back\nKeep the core braced\nControl every rep"],
  ["Chest Dip", "Chest", "Bodyweight", "Horizontal Push", "Lean the torso forward\nLower until you feel the stretch\nPress up without shrugging"],

  // ── Back ───────────────────────────────────────────────────────────────
  ["Lat Pulldown", "Back", "Cable", "Vertical Pull", "Set the thigh pad\nPull to the upper chest\nDrive the elbows down and back"],
  ["Wide-Grip Lat Pulldown", "Back", "Cable", "Vertical Pull", "Grip wider than shoulders\nLead with the elbows\nControl the return"],
  ["Neutral-Grip Lat Pulldown", "Back", "Cable", "Vertical Pull", "Palms facing each other\nPull to the collarbone\nFull stretch overhead"],
  ["Pull-Up", "Back", "Bodyweight", "Vertical Pull", "Start from a full hang\nPull the chest to the bar\nAvoid excessive swinging"],
  ["Chin-Up", "Back", "Bodyweight", "Vertical Pull", "Underhand shoulder-width grip\nDrive elbows to the ribs\nControl the descent"],
  ["Assisted Pull-Up", "Back", "Machine", "Vertical Pull", "Set assistance to hit target reps\nFull range each rep\nNo bouncing at the bottom"],
  ["Seated Cable Row", "Back", "Cable", "Horizontal Pull", "Tall chest, slight lean\nRow to the navel\nSqueeze the shoulder blades"],
  ["Chest-Supported Row", "Back", "Machine", "Horizontal Pull", "Chest stays on the pad\nRow with the elbows\nPause at peak contraction"],
  ["Barbell Row", "Back", "Barbell", "Horizontal Pull", "Hinge to ~45°\nRow to the lower ribs\nKeep a neutral spine"],
  ["Pendlay Row", "Back", "Barbell", "Horizontal Pull", "Bar resets on the floor each rep\nExplosive pull\nFlat back throughout"],
  ["Dumbbell Row", "Back", "Dumbbell", "Horizontal Pull", "Support on a bench\nRow to the hip\nDon't rotate the torso"],
  ["Machine Row", "Back", "Machine", "Horizontal Pull", "Chest against the pad\nDrive elbows back\nControl the stretch"],
  ["T-Bar Row", "Back", "Barbell", "Horizontal Pull", "Neutral grip\nHinge and row to the chest\nKeep the core tight"],
  ["Inverted Row", "Back", "Bodyweight", "Horizontal Pull", "Body straight and rigid\nPull the chest to the bar\nControl down"],
  ["Straight-Arm Pulldown", "Back", "Cable", "Vertical Pull", "Slight elbow bend, fixed\nSweep the bar to the thighs\nFeel the lats"],
  ["Dumbbell Pullover", "Back", "Dumbbell", "Vertical Pull", "Stretch overhead\nPull the weight over the chest\nRibs down"],
  ["Rack Pull", "Back", "Barbell", "Hinge", "Bar set just below the knee\nDrive the hips through\nSqueeze at lockout"],

  // ── Shoulders ──────────────────────────────────────────────────────────
  ["Overhead Barbell Press", "Shoulders", "Barbell", "Vertical Push", "Brace the core and glutes\nPress the bar overhead\nMove the head through at the top"],
  ["Seated Dumbbell Shoulder Press", "Shoulders", "Dumbbell", "Vertical Push", "Start at ear height\nPress up and slightly in\nControl the descent"],
  ["Machine Shoulder Press", "Shoulders", "Machine", "Vertical Push", "Handles at shoulder height\nPress without shrugging\nFull but not locked"],
  ["Arnold Press", "Shoulders", "Dumbbell", "Vertical Push", "Start palms facing you\nRotate as you press\nControl the reverse"],
  ["Dumbbell Lateral Raise", "Shoulders", "Dumbbell", "Isolation", "Lead with the elbows\nRaise to shoulder height\nLower slowly"],
  ["Cable Lateral Raise", "Shoulders", "Cable", "Isolation", "Cable behind the body\nRaise out to the side\nKeep constant tension"],
  ["Machine Lateral Raise", "Shoulders", "Machine", "Isolation", "Pads against the forearms\nDrive out and up\nNo momentum"],
  ["Rear Delt Fly", "Shoulders", "Dumbbell", "Isolation", "Hinge forward\nWide arc out to the sides\nSqueeze the rear delts"],
  ["Reverse Pec Deck", "Shoulders", "Machine", "Isolation", "Chest on the pad\nOpen the arms wide\nControl back to the start"],
  ["Face Pull", "Shoulders", "Cable", "Isolation", "Rope to eye level\nPull to the forehead\nExternally rotate at the end"],
  ["Cable Rear Delt Fly", "Shoulders", "Cable", "Isolation", "Cross the cables\nSweep out and back\nSqueeze the rear delts"],
  ["Landmine Press", "Shoulders", "Barbell", "Vertical Push", "Press up and forward\nKeep the core braced\nControl the return"],

  // ── Biceps ─────────────────────────────────────────────────────────────
  ["Barbell Curl", "Biceps", "Barbell", "Isolation", "Elbows pinned to the sides\nCurl without swinging\nSqueeze at the top"],
  ["EZ-Bar Curl", "Biceps", "Barbell", "Isolation", "Comfortable angled grip\nKeep elbows still\nControl the lowering"],
  ["Dumbbell Curl", "Biceps", "Dumbbell", "Isolation", "Supinate as you curl\nElbows stay fixed\nFull stretch at the bottom"],
  ["Incline Dumbbell Curl", "Biceps", "Dumbbell", "Isolation", "Arms hang back on the incline\nCurl without moving the elbows\nDeep stretch"],
  ["Hammer Curl", "Biceps", "Dumbbell", "Isolation", "Neutral grip\nCurl to the shoulder\nControl down"],
  ["Cable Curl", "Biceps", "Cable", "Isolation", "Constant tension from the cable\nElbows fixed\nSqueeze hard"],
  ["Bayesian Cable Curl", "Biceps", "Cable", "Isolation", "Step forward for a deep stretch\nCurl with fixed elbows\nControl the stretch"],
  ["Preacher Curl", "Biceps", "Barbell", "Isolation", "Upper arms flat on the pad\nDon't fully lock out\nStretch under control"],
  ["Machine Preacher Curl", "Biceps", "Machine", "Isolation", "Arms on the pad\nCurl to full contraction\nSlow negative"],
  ["Concentration Curl", "Biceps", "Dumbbell", "Isolation", "Elbow braced on the thigh\nCurl to a peak squeeze\nLower slowly"],
  ["Spider Curl", "Biceps", "Dumbbell", "Isolation", "Chest on an incline bench\nArms hang straight down\nCurl and squeeze"],

  // ── Triceps ────────────────────────────────────────────────────────────
  ["Cable Pushdown", "Triceps", "Cable", "Isolation", "Elbows pinned to the sides\nExtend fully\nControl back to 90°"],
  ["Rope Pushdown", "Triceps", "Cable", "Isolation", "Split the rope at the bottom\nElbows fixed\nSqueeze the triceps"],
  ["Overhead Cable Extension", "Triceps", "Cable", "Isolation", "Face away from the stack\nExtend overhead\nKeep the elbows high"],
  ["Overhead Dumbbell Extension", "Triceps", "Dumbbell", "Isolation", "One dumbbell in both hands\nLower behind the head\nExtend fully"],
  ["Skull Crusher", "Triceps", "Barbell", "Isolation", "Lower to the forehead\nKeep the elbows in\nExtend without flaring"],
  ["Close-Grip Bench Press", "Triceps", "Barbell", "Horizontal Push", "Shoulder-width grip\nElbows tucked\nDrive through the triceps"],
  ["Triceps Dip", "Triceps", "Bodyweight", "Vertical Push", "Torso upright\nLower to 90°\nPress without shrugging"],
  ["Bench Dip", "Triceps", "Bodyweight", "Vertical Push", "Hands on the bench edge\nLower under control\nExtend fully"],
  ["Machine Triceps Extension", "Triceps", "Machine", "Isolation", "Elbows on the pad\nExtend fully\nSlow return"],
  ["Single-Arm Cable Pushdown", "Triceps", "Cable", "Isolation", "Underhand grip\nElbow fixed\nFull extension each rep"],

  // ── Quadriceps ─────────────────────────────────────────────────────────
  ["Back Squat", "Quadriceps", "Barbell", "Squat", "Brace before descending\nSit down between the hips\nDrive up through mid-foot"],
  ["Front Squat", "Quadriceps", "Barbell", "Squat", "Elbows high, upright torso\nDescend under control\nDrive the knees out"],
  ["Hack Squat", "Quadriceps", "Machine", "Squat", "Feet mid-platform\nDescend deep\nPush through the whole foot"],
  ["Leg Press", "Quadriceps", "Machine", "Squat", "Feet shoulder-width\nLower to a deep knee bend\nDon't lock out hard"],
  ["Smith Machine Squat", "Quadriceps", "Smith Machine", "Squat", "Feet slightly forward\nSit straight down\nControl the depth"],
  ["Bulgarian Split Squat", "Quadriceps", "Dumbbell", "Lunge", "Rear foot elevated\nDrop straight down\nDrive through the front heel"],
  ["Walking Lunge", "Quadriceps", "Dumbbell", "Lunge", "Long stride\nBack knee toward the floor\nPush off the front foot"],
  ["Reverse Lunge", "Quadriceps", "Dumbbell", "Lunge", "Step back and down\nKeep the torso tall\nDrive through the front heel"],
  ["Step-Up", "Quadriceps", "Dumbbell", "Lunge", "Full foot on the box\nDrive through the heel\nControl the descent"],
  ["Leg Extension", "Quadriceps", "Machine", "Isolation", "Align the knees with the pivot\nExtend fully\nSqueeze the quads"],
  ["Goblet Squat", "Quadriceps", "Dumbbell", "Squat", "Hold the weight at the chest\nSquat between the knees\nStay upright"],
  ["Pendulum Squat", "Quadriceps", "Machine", "Squat", "Full-foot pressure\nDescend deep\nDrive smoothly up"],
  ["Sissy Squat", "Quadriceps", "Bodyweight", "Squat", "Lean back on the toes\nBend at the knees\nControl the stretch"],
  ["Belt Squat", "Quadriceps", "Machine", "Squat", "Load hangs from the hips\nSquat deep\nSpine stays neutral"],

  // ── Hamstrings / Glutes ────────────────────────────────────────────────
  ["Romanian Deadlift", "Hamstrings", "Barbell", "Hinge", "Soft knees\nPush the hips back\nFeel the hamstring stretch, then drive"],
  ["Dumbbell Romanian Deadlift", "Hamstrings", "Dumbbell", "Hinge", "Hinge at the hips\nBar close to the legs\nStand tall at the top"],
  ["Stiff-Leg Deadlift", "Hamstrings", "Barbell", "Hinge", "Minimal knee bend\nLower with a flat back\nStretch then drive"],
  ["Conventional Deadlift", "Hamstrings", "Barbell", "Hinge", "Bar over mid-foot\nBrace and push the floor away\nLock hips and knees together"],
  ["Seated Leg Curl", "Hamstrings", "Machine", "Isolation", "Pad above the ankles\nCurl fully\nControl the negative"],
  ["Lying Leg Curl", "Hamstrings", "Machine", "Isolation", "Hips flat on the pad\nCurl to the glutes\nSlow return"],
  ["Standing Leg Curl", "Hamstrings", "Machine", "Isolation", "One leg at a time\nCurl fully\nNo hip swinging"],
  ["Nordic Curl", "Hamstrings", "Bodyweight", "Isolation", "Anchor the ankles\nLower as slowly as possible\nCatch and push back"],
  ["Single-Leg Romanian Deadlift", "Hamstrings", "Dumbbell", "Hinge", "Hinge on one leg\nHips square\nControl the balance"],
  ["Hip Thrust", "Glutes", "Barbell", "Hinge", "Upper back on the bench\nDrive the hips up\nSqueeze the glutes at the top"],
  ["Machine Hip Thrust", "Glutes", "Machine", "Hinge", "Pad on the hips\nDrive to full extension\nBrief squeeze at the top"],
  ["Glute Bridge", "Glutes", "Barbell", "Hinge", "Feet flat, close to the hips\nBridge up\nSqueeze the glutes"],
  ["Cable Pull-Through", "Glutes", "Cable", "Hinge", "Hinge with the cable between the legs\nDrive the hips forward\nSqueeze at the top"],
  ["Cable Glute Kickback", "Glutes", "Cable", "Isolation", "Ankle strap on the cable\nDrive the leg back\nSqueeze, don't arch the back"],
  ["Back Extension", "Glutes", "Bodyweight", "Hinge", "Hinge at the hips\nRaise to a straight line\nSqueeze the glutes"],
  ["45-Degree Hip Extension", "Glutes", "Bodyweight", "Hinge", "Pad on the thighs\nRound slightly to target glutes\nControl up and down"],

  // ── Calves ─────────────────────────────────────────────────────────────
  ["Standing Calf Raise", "Calves", "Machine", "Isolation", "Full stretch at the bottom\nRise onto the toes\nPause at the top"],
  ["Seated Calf Raise", "Calves", "Machine", "Isolation", "Pad on the lower thighs\nDeep stretch\nSqueeze the calves"],
  ["Leg Press Calf Raise", "Calves", "Machine", "Isolation", "Balls of the feet on the platform\nPush through the toes\nControl the stretch"],
  ["Smith Machine Calf Raise", "Calves", "Smith Machine", "Isolation", "Toes on a plate\nFull range\nPause at the top"],
  ["Single-Leg Calf Raise", "Calves", "Bodyweight", "Isolation", "One leg at a time\nFull stretch and squeeze\nSlow tempo"],

  // ── Core ───────────────────────────────────────────────────────────────
  ["Cable Crunch", "Core", "Cable", "Isolation", "Rope behind the head\nCrunch with the abs\nRound the spine down"],
  ["Hanging Leg Raise", "Core", "Bodyweight", "Isolation", "Hang without swinging\nRaise the legs to parallel or higher\nLower slowly"],
  ["Hanging Knee Raise", "Core", "Bodyweight", "Isolation", "Drive the knees up\nCurl the pelvis\nControl the descent"],
  ["Ab Wheel Rollout", "Core", "Other", "Isolation", "Brace hard\nRoll out only as far as you can control\nPull back with the abs"],
  ["Plank", "Core", "Bodyweight", "Isolation", "Straight line head to heels\nSqueeze glutes and abs\nDon't let the hips sag"],
  ["Side Plank", "Core", "Bodyweight", "Isolation", "Stack the hips\nLift into a straight line\nHold and breathe"],
  ["Pallof Press", "Core", "Cable", "Isolation", "Resist the rotation\nPress straight out\nKeep the hips square"],
  ["Reverse Crunch", "Core", "Bodyweight", "Isolation", "Curl the pelvis up\nControl the lowering\nKeep tension on the abs"],
  ["Machine Crunch", "Core", "Machine", "Isolation", "Crunch through the abs\nFull contraction\nSlow return"],
  ["Cable Woodchopper", "Core", "Cable", "Isolation", "Rotate through the trunk\nArms fairly straight\nControl back"],
  ["Dead Bug", "Core", "Bodyweight", "Isolation", "Lower back pressed down\nExtend opposite arm and leg\nMove slowly"],
  ["Hollow Body Hold", "Core", "Bodyweight", "Isolation", "Lower back on the floor\nLift shoulders and legs\nStay tight"],

  // ── Traps ──────────────────────────────────────────────────────────────
  ["Barbell Shrug", "Traps", "Barbell", "Isolation", "Let the shoulders hang\nShrug straight up\nPause at the top"],
  ["Dumbbell Shrug", "Traps", "Dumbbell", "Isolation", "Arms relaxed\nShrug up\nControl the descent"],
  ["Cable Shrug", "Traps", "Cable", "Isolation", "Constant tension\nShrug up and slightly back\nSqueeze"],
  ["Barbell Upright Row", "Traps", "Barbell", "Vertical Pull", "Lead with the elbows\nPull to the collarbone\nKeep the bar close"],

  // ── Forearms ───────────────────────────────────────────────────────────
  ["Barbell Wrist Curl", "Forearms", "Barbell", "Isolation", "Forearms on the thighs\nCurl the wrists up\nFull stretch down"],
  ["Reverse Wrist Curl", "Forearms", "Barbell", "Isolation", "Palms down\nExtend the wrists up\nControl the lowering"],
  ["Reverse Curl", "Forearms", "Barbell", "Isolation", "Overhand grip\nCurl with fixed elbows\nSqueeze the forearms"],
  ["Farmer's Carry", "Forearms", "Dumbbell", "Carry", "Tall posture\nWalk with a strong grip\nBraced core throughout"],

  // ── Adductors / Abductors ──────────────────────────────────────────────
  ["Hip Adduction Machine", "Adductors", "Machine", "Isolation", "Drive the knees together\nControl the stretch\nPause at the squeeze"],
  ["Hip Abduction Machine", "Abductors", "Machine", "Isolation", "Push the knees apart\nSlight forward lean for glutes\nControl back"],
  ["Cable Hip Abduction", "Abductors", "Cable", "Isolation", "Ankle strap on the cable\nDrive the leg out\nDon't lean excessively"],
  ["Copenhagen Plank", "Adductors", "Bodyweight", "Isolation", "Top leg on the bench\nLift the hips\nHold a straight line"],

  // ── Lower Back ─────────────────────────────────────────────────────────
  ["Hyperextension", "Lower Back", "Bodyweight", "Hinge", "Hinge at the hips\nRaise to neutral\nDon't over-arch"],
  ["Good Morning", "Lower Back", "Barbell", "Hinge", "Soft knees\nHinge the hips back\nFlat back throughout"],
];

const norm = (s) => s.trim().toLowerCase();

const existingRows = await sql`select name from exercises`;
const existing = new Set(existingRows.map((r) => norm(r.name)));

let inserted = 0, skipped = 0;
for (const [name, muscle, , , cues] of LIB) {
  if (existing.has(norm(name))) { skipped++; continue; }
  await sql`insert into exercises (name, muscle_group, cues) values (${name}, ${muscle}, ${cues})`;
  existing.add(norm(name));
  inserted++;
}

const total = (await sql`select count(*)::int n from exercises`)[0].n;
console.log(`Seed complete. Inserted ${inserted}, skipped ${skipped} (already existed). Library now has ${total} exercises.`);
