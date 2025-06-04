// main.js

// 1) XP curve: e.g. base = 100 XP for Level 1→2; each next level costs 1.1× previous.
//    You can tweak this to match Runescape’s exact formula or use a simpler linear curve.
function xpNeededForLevel(level) {
  if (level <= 1) return 100;
  return Math.floor(xpNeededForLevel(level - 1) * 1.1);
}

// 2) Default profile structure: add more skills as needed.
const DEFAULT_PROFILE = {
  strength: { xp: 0, level: 1 },
  // e.g. endurance: { xp: 0, level: 1 }, flexibility: { xp: 0, level: 1 }, etc.
};

// 3) Load the profile from localStorage (or initialize if absent)
function loadProfile() {
  const raw = localStorage.getItem("workoutProfile");
  return raw ? JSON.parse(raw) : { ...DEFAULT_PROFILE };
}

// 4) Save the profile back to localStorage
function saveProfile(profile) {
  localStorage.setItem("workoutProfile", JSON.stringify(profile));
}

// 5) Update the DOM elements for one skill
function renderSkill(skillName, data) {
  const lvlEl    = document.getElementById(`${skillName}-level`);
  const xpEl     = document.getElementById(`${skillName}-xp`);
  const nextEl   = document.getElementById(`${skillName}-xp-next`);
  const barEl    = document.getElementById(`${skillName}-bar`);

  const { level, xp } = data;
  const needed = xpNeededForLevel(level);

  lvlEl.textContent   = level;
  xpEl.textContent    = xp;
  nextEl.textContent  = needed;
  barEl.value         = xp;
  barEl.max           = needed;
}

// 6) Loop through all skills and render them
function renderAllSkills() {
  const profile = loadProfile();
  Object.entries(profile).forEach(([skillName, skillData]) => {
    renderSkill(skillName, skillData);
  });
}

// 7) Handle clicks on “award XP” buttons
function handleActionClick(event) {
  const btn = event.target.closest("button[data-skill]");
  if (!btn) return;

  const skill = btn.dataset.skill;        // e.g. "strength"
  const bonus = parseInt(btn.dataset.xp, 10); // e.g. 10

  const profile = loadProfile();
  let { xp, level } = profile[skill];
  if (level >= 99) return; // Already maxed out

  xp += bonus;

  // Check for level-ups as long as xp ≥ xpNeededForLevel(currentLevel)
  while (xp >= xpNeededForLevel(level) && level < 99) {
    xp -= xpNeededForLevel(level);
    level += 1;
    if (level === 99) {
      xp = 0; // cap xp at 0 when you hit Level 99
      break;
    }
  }

  profile[skill] = { xp, level };
  saveProfile(profile);
  renderAllSkills();
}

// 8) Set up event listeners on page load
document.addEventListener("DOMContentLoaded", () => {
  renderAllSkills();
  document.body.addEventListener("click", handleActionClick);
});
