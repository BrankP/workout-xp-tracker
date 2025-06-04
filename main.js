// main.js

// 1) XP curve: base=100 XP for L1→2, then ×1.1 each level (you can tweak this).
function xpNeededForLevel(level) {
  if (level <= 1) return 100;
  return Math.floor(xpNeededForLevel(level - 1) * 1.1);
}

// 2) DEFAULT_PROFILE: include agility alongside strength (and any other skills)
const DEFAULT_PROFILE = {
  strength:  { xp: 0, level: 1 },
  agility:   { xp: 0, level: 1 },
  // If you add other skills later, list them the same way:
  // endurance: { xp: 0, level: 1 },
};

// 3) Load from localStorage (or fallback to DEFAULT_PROFILE)
function loadProfile() {
  const raw = localStorage.getItem("workoutProfile");
  return raw ? JSON.parse(raw) : { ...DEFAULT_PROFILE };
}

// 4) Save back to localStorage
function saveProfile(profile) {
  localStorage.setItem("workoutProfile", JSON.stringify(profile));
}

// 5) Render one skill’s UI based on skillName (“strength” or “agility”) and its data
function renderSkill(skillName, data) {
  const lvlEl  = document.getElementById(`${skillName}-level`);
  const xpEl   = document.getElementById(`${skillName}-xp`);
  const nextEl = document.getElementById(`${skillName}-xp-next`);
  const barEl  = document.getElementById(`${skillName}-bar`);

  const { level, xp } = data;
  const needed = xpNeededForLevel(level);

  lvlEl.textContent  = level;
  xpEl.textContent   = xp;
  nextEl.textContent = needed;
  barEl.value        = xp;
  barEl.max          = needed;
}

// 6) Loop over all skills in the profile and render them
function renderAllSkills() {
  const profile = loadProfile();
  Object.entries(profile).forEach(([skillName, skillData]) => {
    renderSkill(skillName, skillData);
  });
}

// 7) Handle button clicks to add XP; works for any skillName in DEFAULT_PROFILE
function handleActionClick(event) {
  const btn = event.target.closest("button[data-skill]");
  if (!btn) return;

  const skill = btn.dataset.skill;         // “strength” or “agility”
  const bonus = parseInt(btn.dataset.xp, 10);

  const profile = loadProfile();
  let { xp, level } = profile[skill];
  if (level >= 99) return;   // already maxed out

  xp += bonus;

  // Check for level-ups
  while (xp >= xpNeededForLevel(level) && level < 99) {
    xp -= xpNeededForLevel(level);
    level += 1;
    if (level === 99) {
      xp = 0;  // cap XP when hitting 99
      break;
    }
  }

  profile[skill] = { xp, level };
  saveProfile(profile);
  renderAllSkills();
}

// 8) On page load, render everything and wire up the event listener
document.addEventListener("DOMContentLoaded", () => {
  renderAllSkills();
  document.body.addEventListener("click", handleActionClick);
});
