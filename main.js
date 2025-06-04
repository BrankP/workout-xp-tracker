// main.js

// 1) XP curve: base = 100 XP for L1→2; each next level costs 1.1× previous.
function xpNeededForLevel(level) {
  // For Level 1→2, you need 83 XP:
  if (level <= 1) return 83;

  // Otherwise, build up iteratively from 83, multiplying by ≈1.1040909 each step.
  // (level = 2 means “XP needed to go from 2→3,” etc.)
  const GROWTH = 1.1040909;
  let xp = 83; 
  for (let lv = 2; lv <= level; lv++) {
    xp = Math.floor(xp * GROWTH);
  }
  return xp;
}

// 2) DEFAULT_PROFILE: list every skill here. Any new skill must appear here.
const DEFAULT_PROFILE = {
  strength: { xp: 0, level: 1 },
  agility:  { xp: 0, level: 1 },
  // (If you add more skills later, add them here in the same format.)
};

// 3) Load from localStorage, merging with DEFAULT_PROFILE so new skills are auto‐initialized
function loadProfile() {
  const raw = localStorage.getItem("workoutProfile");
  if (!raw) {
    // No saved profile at all → use a fresh copy of DEFAULT_PROFILE
    return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  }

  // Merge saved values with defaults:
  const saved = JSON.parse(raw);
  const merged = {};

  // For each skill in DEFAULT_PROFILE, if saved has it, use saved; otherwise use default
  Object.keys(DEFAULT_PROFILE).forEach((skillName) => {
    if (saved[skillName]) {
      merged[skillName] = saved[skillName];
    } else {
      merged[skillName] = { ...DEFAULT_PROFILE[skillName] };
    }
  });

  return merged;
}

// 4) Save the profile object back into localStorage
function saveProfile(profile) {
  localStorage.setItem("workoutProfile", JSON.stringify(profile));
}

// 5) Render one skill’s UI based on its name ("strength" or "agility") and data
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

// 6) Loop through all skills in the profile and render them
function renderAllSkills() {
  const profile = loadProfile();
  Object.entries(profile).forEach(([skillName, skillData]) => {
    renderSkill(skillName, skillData);
  });
}

// 7) Handle clicks on “award XP” buttons (works for any skill in DEFAULT_PROFILE)
function handleActionClick(event) {
  const btn = event.target.closest("button[data-skill]");
  if (!btn) return;

  const skill = btn.dataset.skill;          // e.g. "strength" or "agility"
  const bonus = parseInt(btn.dataset.xp, 10); // e.g. 10, 100, etc.

  const profile = loadProfile();
  let { xp, level } = profile[skill];

  // If already at max, do nothing
  if (level >= 99) return;

  xp += bonus;

  // Level‐up loop
  while (xp >= xpNeededForLevel(level) && level < 99) {
    xp -= xpNeededForLevel(level);
    level += 1;
    if (level === 99) {
      xp = 0; // cap XP at 0 when you hit Level 99
      break;
    }
  }

  profile[skill] = { xp, level };
  saveProfile(profile);
  renderAllSkills();
}

// 8) On page load, render all skills and attach click listener
document.addEventListener("DOMContentLoaded", () => {
  renderAllSkills();
  document.body.addEventListener("click", handleActionClick);
});
