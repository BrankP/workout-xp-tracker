// main.js

// 1) RuneScape-style XP curve (≈10.409% growth per level; base = 83)
function xpNeededForLevel(level) {
  if (level <= 1) return 83;
  const GROWTH = 1.1040909;
  let xp = 83;
  for (let lv = 2; lv <= level; lv++) {
    xp = Math.floor(xp * GROWTH);
  }
  return xp;
}

// 2) DEFAULT_PROFILE: list each skill with initial xp & level
const DEFAULT_PROFILE = {
  strength: { xp: 0, level: 1 },
  agility:  { xp: 0, level: 1 },
  // Add more skills here later if desired
};

// 3) Load the skill profile from localStorage, merging with DEFAULT_PROFILE
function loadProfile() {
  const raw = localStorage.getItem("workoutProfile");
  if (!raw) {
    // No saved data → return a fresh deep copy of DEFAULT_PROFILE
    return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  }
  const saved = JSON.parse(raw);
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

// 4) Save the skill profile back to localStorage
function saveProfile(profile) {
  localStorage.setItem("workoutProfile", JSON.stringify(profile));
}

// 5) Load & save Gold Pieces (GP) from localStorage
function loadGP() {
  const raw = localStorage.getItem("workoutGP");
  return raw ? parseInt(raw, 10) : 0;
}
function saveGP(gp) {
  localStorage.setItem("workoutGP", gp);
}

// 6) Render the GP count into the DOM
function renderGP() {
  const gp = loadGP();
  const el = document.getElementById("gp-count");
  if (el) el.textContent = gp;
}

// 7) Render a single skill’s UI (level, xp, progress bar)
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

// 8) Render all skills and the GP count
function renderAll() {
  const profile = loadProfile();
  Object.entries(profile).forEach(([skillName, skillData]) => {
    renderSkill(skillName, skillData);
  });
  renderGP();
}

// 9) Handle clicks on any <button data-skill="…">: award XP and +1 gp
function handleActionClick(event) {
  const btn = event.target.closest("button[data-skill]");
  if (!btn) return;

  const skill = btn.dataset.skill;          // e.g. "strength" or "agility"
  const bonus = parseInt(btn.dataset.xp, 10); // e.g. 10, 100, etc.

  // 9a) Update GP
  let gp = loadGP();
  gp += 1;            // +1 gp per activity
  saveGP(gp);

  // 9b) Update XP & level for the clicked skill
  const profile = loadProfile();
  let { xp, level } = profile[skill];
  if (level < 99) {
    xp += bonus;
    // Level‐up loop
    while (xp >= xpNeededForLevel(level) && level < 99) {
      xp -= xpNeededForLevel(level);
      level += 1;
      if (level === 99) {
        xp = 0; // once at 99, cap xp to 0
        break;
      }
    }
    profile[skill] = { xp, level };
    saveProfile(profile);
  }

  // 9c) Re-render both skills and GP
  renderAll();
}

// 10) On page load, render everything and attach the click listener
document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  document.body.addEventListener("click", handleActionClick);
});
