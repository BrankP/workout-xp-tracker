// main.js

// ─────────── 1) MONSTERS ARRAY ───────────
// Index 0 = Chicken; index 9 = TzTok-Jad.
const MONSTERS = [
  { name: "Chicken",          combatLevel: 1,   hp: 5,    xp: 50,     attack: 1  },
  { name: "Goblin",           combatLevel: 3,   hp: 20,   xp: 100,    attack: 2  },
  { name: "Skeleton",         combatLevel: 8,   hp: 40,   xp: 200,    attack: 4  },
  { name: "Zombie",           combatLevel: 15,  hp: 60,   xp: 350,    attack: 6  },
  { name: "Troll",            combatLevel: 30,  hp: 100,  xp: 700,    attack: 12 },
  { name: "Demon",            combatLevel: 45,  hp: 150,  xp: 1200,   attack: 18 },
  { name: "Dragon",           combatLevel: 60,  hp: 200,  xp: 2000,   attack: 25 },
  { name: "King Black Dragon",combatLevel: 100, hp: 250,  xp: 3000,   attack: 40 },
  { name: "Corporeal Beast",  combatLevel: 126, hp: 400,  xp: 5000,   attack: 55 },
  { name: "TzTok-Jad",        combatLevel: 303, hp: 603,  xp: 10000,  attack: 70 },
];

// ─────────── 2) RuneScape‐Style XP Curve ───────────
// When level ≤ 1, xpNeededForLevel(1) = 83.
// Otherwise, multiply by ~1.1040909 each step, floored.
function xpNeededForLevel(level) {
  if (level <= 1) return 83;
  let xp = 83;
  for (let lv = 2; lv <= level; lv++) {
    xp = Math.floor(xp * 1.1040909);
  }
  return xp;
}

// Combat Level = smallest L (1 ≤ L ≤ 99) such that xpNeededForLevel(L) > totalXP
function computeCombatLevel(totalXP) {
  for (let lvl = 1; lvl <= 99; lvl++) {
    if (xpNeededForLevel(lvl) > totalXP) {
      return lvl;
    }
  }
  return 99;
}

// ─────────── 3) DEFAULT PROFILE (Strength, Agility, Slayer) ───────────
const DEFAULT_PROFILE = {
  strength: { xp: 0, level: 1 },
  agility:  { xp: 0, level: 1 },
  slayer:   { xp: 0, level: 1 },
};

// ─────────── 4) LocalStorage Keys ───────────
const PROFILE_KEY = "workoutProfile";
const GP_KEY      = "workoutGP";
const ATTACK_KEY  = "workoutAttack";

// ─────────── 5) Load / Save Profile ───────────
function loadProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  }
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    saved = {};
  }
  const merged = {};
  Object.keys(DEFAULT_PROFILE).forEach((skillName) => {
    if (saved[skillName]) {
      merged[skillName] = saved[skillName];
    } else {
      merged[skillName] = { ...DEFAULT_PROFILE[skillName] };
    }
  });
  return merged;
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ─────────── 6) Load / Save Gold Pieces (GP) ───────────
function loadGP() {
  const raw = localStorage.getItem(GP_KEY);
  return raw ? parseInt(raw, 10) : 0;
}
function saveGP(gp) {
  localStorage.setItem(GP_KEY, gp);
}

// ─────────── 7) Load / Save Attack ───────────
function loadAttack() {
  const raw = localStorage.getItem(ATTACK_KEY);
  return raw ? parseInt(raw, 10) : 1;
}
function saveAttack(atk) {
  localStorage.setItem(ATTACK_KEY, atk);
}

// ─────────── 8) Rendering Functions ───────────

// Render a single skill’s card (level, xp, xp to next level, progress bar)
function renderSkill(skillName, data) {
  const lvlEl  = document.getElementById(`${skillName}-level`);
  const xpEl   = document.getElementById(`${skillName}-xp`);
  const nextEl = document.getElementById(`${skillName}-xp-next`);
  const barEl  = document.getElementById(`${skillName}-bar`);

  if (!lvlEl || !xpEl || !nextEl || !barEl) return;

  const { level, xp } = data;
  const needed = xpNeededForLevel(level);

  lvlEl.textContent   = level;
  xpEl.textContent    = xp;
  nextEl.textContent  = needed;
  barEl.value         = xp;
  barEl.max           = needed;
}

// Render Gold count
function renderGP() {
  const el = document.getElementById("gp-count");
  if (!el) return;
  el.textContent = loadGP();
}

// Render Combat Level (sum XP across all skills)
function renderCombatLevel() {
  const el = document.getElementById("combat-level");
  if (!el) return;
  const profile = loadProfile();
  let totalXP = 0;
  Object.values(profile).forEach((skillData) => {
    totalXP += skillData.xp;
  });
  const cl = computeCombatLevel(totalXP);
  el.textContent = cl;
}

// Render Attack
function renderAttack() {
  const el = document.getElementById("attack-count");
  if (!el) return;
  el.textContent = loadAttack();
}

// Render all pieces of data at once (strength, agility, slayer, gp, etc.)
function renderAll() {
  const profile = loadProfile();
  renderSkill("strength", profile.strength);
  renderSkill("agility",  profile.agility);
  renderSkill("slayer",   profile.slayer);
  renderGP();
  renderCombatLevel();
  renderAttack();
}

// ─────────── 9) Click Handler ───────────

function handleActionClick(event) {
  // 9a) Market Upgrade Button? (spend 5 gp → +5 attack)
  const upgradeBtn = event.target.closest("#upgrade-btn");
  if (upgradeBtn) {
    let gp = loadGP();
    if (gp >= 5) {
      gp -= 5;
      saveGP(gp);

      let atk = loadAttack();
      atk += 5;
      saveAttack(atk);
    }
    renderAll();
    return;
  }

  // 9b) “Attack” button on fight page? (aggregated slider + monster logic)
  const goBtn = event.target.closest("#go-btn");
  if (goBtn) {
    const pushupsSlider = document.getElementById("pushups-slider");
    const squatsSlider  = document.getElementById("squats-slider");
    const monsterSlider = document.getElementById("monster-slider");

    if (pushupsSlider && squatsSlider && monsterSlider) {
      const pushupsCount = parseInt(pushupsSlider.value, 10);
      const squatsCount  = parseInt(squatsSlider.value, 10);

      // 1) Determine which monster is selected
      const monsterIndex = parseInt(monsterSlider.value, 10);
      const monster      = MONSTERS[monsterIndex] || MONSTERS[0];

      // 2) Award gp:
      //    • +2 gp for doing both exercise types (push-ups + squats)
      //    • +1 gp for killing the monster
      let gp = loadGP();
      gp += 2;     // one gp per exercise type
      gp += 1;     // one gp for monster defeat
      saveGP(gp);

      // 3) Compute total Strength XP from reps:
      const repXP = pushupsCount + squatsCount;

      // 4) Compute damage to monster: each 10 reps = 1 damage
      const totalReps = pushupsCount + squatsCount;
      const damage    = totalReps / 10;

      // 5) Award Strength XP:
      const profile = loadProfile();
      let { xp: strXP, level: strLevel } = profile.strength;

      strXP += repXP;
      while (strXP >= xpNeededForLevel(strLevel) && strLevel < 99) {
        strXP -= xpNeededForLevel(strLevel);
        strLevel += 1;
        if (strLevel === 99) {
          strXP = 0;
          break;
        }
      }
      profile.strength = { xp: strXP, level: strLevel };

      // 6) If monster is defeated, award monster.xp to Slayer:
      if (damage >= monster.hp) {
        let { xp: slayerXP, level: slayerLevel } = profile.slayer;
        slayerXP += monster.xp;
        while (slayerXP >= xpNeededForLevel(slayerLevel) && slayerLevel < 99) {
          slayerXP -= xpNeededForLevel(slayerLevel);
          slayerLevel += 1;
          if (slayerLevel === 99) {
            slayerXP = 0;
            break;
          }
        }
        profile.slayer = { xp: slayerXP, level: slayerLevel };
      }

      // 7) Save updated profile
      saveProfile(profile);

      // 8) Reset sliders & labels, and reset monster slider to 0 (Chicken)
      pushupsSlider.value = 10;
      squatsSlider.value  = 10;
      document.getElementById("pushups-value").textContent = "10";
      document.getElementById("squats-value").textContent  = "10";

      monsterSlider.value = 0;
      document.getElementById("monster-name").textContent = MONSTERS[0].name;
      document.getElementById("monster-cl").textContent   = MONSTERS[0].combatLevel;
      document.getElementById("monster-hp").textContent   = MONSTERS[0].hp;
      document.getElementById("monster-xp").textContent   = MONSTERS[0].xp;
      document.getElementById("monster-atk").textContent  = MONSTERS[0].attack;
    }

    renderAll();
    return;
  }

  // 9c) Exercise or Run Buttons? (data-skill="strength" or "agility")
  const btn = event.target.closest("button[data-skill]");
  if (!btn) return;

  const skill = btn.dataset.skill;           // "strength"/"agility"
  const bonus = parseInt(btn.dataset.xp, 10); // e.g. 10, 100, etc.

  // Award 1 gp per exercise/run
  let gp = loadGP();
  gp += 1;
  saveGP(gp);

  // Award XP & handle level-ups for that skill
  const profile = loadProfile();
  let { xp, level } = profile[skill];
  if (level < 99) {
    xp += bonus;
    while (xp >= xpNeededForLevel(level) && level < 99) {
      xp -= xpNeededForLevel(level);
      level += 1;
      if (level === 99) {
        xp = 0;
        break;
      }
    }
    profile[skill] = { xp, level };
    saveProfile(profile);
  }

  renderAll();
}

// ─────────── 10) Slider & Monster‐Label Initialization ───────────

function initSlidersAndMonster() {
  const pushupsSlider = document.getElementById("pushups-slider");
  const squatsSlider  = document.getElementById("squats-slider");
  const monsterSlider = document.getElementById("monster-slider");

  if (pushupsSlider) {
    pushupsSlider.addEventListener("input", (e) => {
      const valSpan = document.getElementById("pushups-value");
      if (valSpan) valSpan.textContent = e.target.value;
    });
  }
  if (squatsSlider) {
    squatsSlider.addEventListener("input", (e) => {
      const valSpan = document.getElementById("squats-value");
      if (valSpan) valSpan.textContent = e.target.value;
    });
  }
  if (monsterSlider) {
    // Change to 'change' so stats update only after user releases slider
    monsterSlider.addEventListener("change", (e) => {
      const idx = parseInt(e.target.value, 10);
      const mon = MONSTERS[idx] || MONSTERS[0];

      // Update monster name
      const nameSpan = document.getElementById("monster-name");
      if (nameSpan) nameSpan.textContent = mon.name;

      // Update each stat line
      const clSpan  = document.getElementById("monster-cl");
      const hpSpan  = document.getElementById("monster-hp");
      const xpSpan  = document.getElementById("monster-xp");
      const atkSpan = document.getElementById("monster-atk");

      if (clSpan)  clSpan.textContent  = mon.combatLevel;
      if (hpSpan)  hpSpan.textContent  = mon.hp;
      if (xpSpan)  xpSpan.textContent  = mon.xp;
      if (atkSpan) atkSpan.textContent = mon.attack;
    });
  }
}

// ─────────── 11) Initialization on Page Load ───────────

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  initSlidersAndMonster();
  document.body.addEventListener("click", handleActionClick);
});
