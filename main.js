// main.js

// 1) RuneScape‐style XP curve (≈10.409% growth per level; base = 83)
function xpNeededForLevel(level) {
  // If level=1, XP required to go to level 2 is exactly 83:
  if (level <= 1) return 83;

  const GROWTH = 1.1040909;
  let xp = 83;
  // Each iteration computes xpNeededForLevel(2), xpNeededForLevel(3), … up to xpNeededForLevel(level)
  for (let lv = 2; lv <= level; lv++) {
    xp = Math.floor(xp * GROWTH);
  }
  return xp;
}

// 2) DEFAULT_PROFILE: every skill starts at xp=0, level=1
const DEFAULT_PROFILE = {
  strength: { xp: 0, level: 1 },
  agility:  { xp: 0, level: 1 },
  // (Later: add new skills here in the same format)
};

// 3) Load the skill‐profile from localStorage, merging in any missing keys from DEFAULT_PROFILE
function loadProfile() {
  const raw = localStorage.getItem("workoutProfile");
  if (!raw) {
    // No data saved yet → return a fresh deep copy of DEFAULT_PROFILE
    return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  }
  const saved = JSON.parse(raw);
  const merged = {};

  // Ensure that every skillName in DEFAULT_PROFILE exists in merged:
  Object.keys(DEFAULT_PROFILE).forEach((skillName) => {
    if (saved[skillName]) {
      // If user already had saved data for this skill, keep it
      merged[skillName] = saved[skillName];
    } else {
      // Otherwise, initialize from DEFAULT_PROFILE
      merged[skillName] = { ...DEFAULT_PROFILE[skillName] };
    }
  });
  return merged;
}

// 4) Save the skill‐profile back into localStorage
function saveProfile(profile) {
  localStorage.setItem("workoutProfile", JSON.stringify(profile));
}

// 5) Load & save Gold Pieces (GP) from localStorage under "workoutGP"
function loadGP() {
  const raw = localStorage.getItem("workoutGP");
  return raw ? parseInt(raw, 10) : 0;
}
function saveGP(gp) {
  localStorage.setItem("workoutGP", gp);
}

// 6) Compute "Combat Level" from total XP across all skills
//    Combat Level = smallest L (1 ≤ L ≤ 99) such that xpNeededForLevel(L) > totalXP.
//    (Which means if xpNeededForLevel(14)=288, and totalXP=287, combatLevel=14.)
function computeCombatLevel(totalXP) {
  for (let lvl = 1; lvl <= 99; lvl++) {
    if (xpNeededForLevel(lvl) > totalXP) {
      return lvl;
    }
  }
  // If totalXP is so high that it exceeds xpNeededForLevel(99), just cap at 99:
  return 99;
}

// 7) Render the GP count
function renderGP() {
  const gp = loadGP();
  const el = document.getElementById("gp-count");
  if (el) el.textContent = gp;
}

// 8) Render the Combat Level display
function renderCombatLevel() {
  // Sum up xp from every skill in the profile
  const profile = loadProfile();
  let totalXP = 0;
  Object.values(profile).forEach((skillData) => {
    totalXP += skillData.xp;
  });

  const combatLevel = computeCombatLevel(totalXP);
  const el = document.getElementById("combat-level");
  if (el) el.textContent = combatLevel;
}

// 9) Render one skill’s UI (level, xp, xp to next level, progress bar)
function renderSkill(skillName, data) {
  const lvlEl  = document.getElementById(`${skillName}-level`);
  const xpEl   = document.getElementById(`${skillName}-xp`);
  const nextEl = document.getElementById(`${skillName}-xp-next`);
  const barEl  = document.getElementById(`${skillName}-bar`);

  const { level, xp } = data;
  const needed = xpNeededForLevel(level);

  lvlEl.textContent   = level;
  xpEl.textContent    = xp;
  nextEl.textContent  = needed;
  barEl.value         = xp;
  barEl.max           = needed;
}

// 10) Render all skills + GP + Combat Level
function renderAll() {
  const profile = loadProfile();
  Object.entries(profile).forEach(([skillName, skillData]) => {
    renderSkill(skillName, skillData);
  });
  renderGP();
  renderCombatLevel();
}

// 11) Handle clicks on any <button data-skill="…">:
//      • +1 gp
//      • award XP to that skill & handle level-ups
//      • re-render everything
function handleActionClick(event) {
  const btn = event.target.closest("button[data-skill]");
  if (!btn) return;

  const skill = btn.dataset.skill;           // "strength" or "agility"
  const bonus = parseInt(btn.dataset.xp, 10); // e.g. 10, 100, 500, etc.

  // 11a) Increase Gold by 1
  let gp = loadGP();
  gp += 1;
  saveGP(gp);

  // 11b) Update XP & Level for that skill
  const profile = loadProfile();
  let { xp, level } = profile[skill];

  if (level < 99) {
    xp += bonus;

    // Level-up loop: as long as xp ≥ xpNeededForLevel(currentLevel), increment level
    while (xp >= xpNeededForLevel(level) && level < 99) {
      xp -= xpNeededForLevel(level);
      level += 1;
      if (level === 99) {
        xp = 0; // Cap XP at 0 once you hit level 99
        break;
      }
    }

    profile[skill] = { xp, level };
    saveProfile(profile);
  }

  // 11c) Re-render all UI parts (skills, gp, combat level)
  renderAll();
}

// 12) On initial page load, render everything and wire up the click listener
document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  document.body.addEventListener("click", handleActionClick);
});
