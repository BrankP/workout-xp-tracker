// main.js

// 1) XP curve: Base = 100 XP for Level 1→2. Each subsequent level costs 1.1× the previous.
//    You can adjust this function to suit your own leveling curve.
function xpNeededForLevel(level) {
  if (level <= 1) return 100;
  return Math.floor(xpNeededForLevel(level - 1) * 1.1);
}

// 2) DEFAULT_PROFILE: List every skill here with initial xp: 0 and level: 1.
const DEFAULT_PROFILE = {
  strength: { xp: 0, level: 1 },
  agility:  { xp: 0, level: 1 },
  // If you add more skills later (endurance, flexibility, etc.), use the same format.
};

// 3) Load the profile from localStorage, or fall back to DEFAULT_PROFILE
function loadProfile() {
  const raw = localStorage.getItem("workoutProfile");
  return raw ? JSON.parse(raw) : { ...DEFAULT_PROFILE };
}

// 4) Save the profile object back into localStorage
function saveProfile(profile) {
  localStorage.setItem("workoutProfile", JSON.stringify(profile));
}

// 5) Render a single skill’s UI based on its name ("strength" or "agility") and data.
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

// 6) Go through all skills in the profile and call renderSkill() for each
function renderAllSkills() {
  const profile = loadProfile();
  Object.entries(profile).forEach(([skillName, skillData]) => {
    renderSkill(skillName, skillData);
  });
}

// 7) Handle clicks on any button that has a data-skill attribute: award XP accordingly.
function handleActionClick(event) {
  const btn = event.target.closest("button[data-skill]");
  if (!btn) return;

  const skill = btn.dataset.skill;          // e.g. "strength" or "agility"
  const bonus = parseInt(btn.dataset.xp, 10); // e.g. 10, 100, etc.

  const profile = loadProfile();
  let { xp, level } = profile[skill];

  // If already at max level, do nothing
  if (level >= 99) return;

  xp += bonus;

  // Level‐up loop: as long as xp ≥ needed XP for current level, increase level
  while (xp >= xpNeededForLevel(level) && level < 99) {
    xp -= xpNeededForLevel(level);
    level += 1;
    if (level === 99) {
      xp = 0; // Cap XP at 0 once you hit level 99
      break;
    }
  }

  // Save updated xp & level back into the profile
  profile[skill] = { xp, level };
  saveProfile(profile);
  renderAllSkills();
}

// 8) On page load, render everything and attach the click listener
document.addEventListener("DOMContentLoaded", () => {
  renderAllSkills();
  document.body.addEventListener("click", handleActionClick);
});
