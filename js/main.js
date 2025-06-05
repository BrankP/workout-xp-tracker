// main.js

// ─────────── RuneScape‐Style XP Curve ───────────
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

// ─────────── Default Profile (Strength + Agility) ───────────
const DEFAULT_PROFILE = {
  strength: { xp: 0, level: 1 },
  agility:  { xp: 0, level: 1 },
};

// ─────────── LocalStorage Keys ───────────
const PROFILE_KEY = "workoutProfile";
const GP_KEY      = "workoutGP";
const ATTACK_KEY  = "workoutAttack";

// ─────────── Load / Save Profile ───────────
function loadProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    // No saved profile → initialize with defaults
    return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  }
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    saved = {};
  }
  // Merge: if a key is missing (e.g., user had only strength saved), fill it with default
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

// ─────────── Load / Save Gold Pieces (GP) ───────────
function loadGP() {
  const raw = localStorage.getItem(GP_KEY);
  return raw ? parseInt(raw, 10) : 0;
}
function saveGP(gp) {
  localStorage.setItem(GP_KEY, gp);
}

// ─────────── Load / Save Attack ───────────
function loadAttack() {
  const raw = localStorage.getItem(ATTACK_KEY);
  return raw ? parseInt(raw, 10) : 1;
}
function saveAttack(atk) {
  localStorage.setItem(ATTACK_KEY, atk);
}

// ─────────── Rendering Functions ───────────

// Render a single skill’s card (level, xp, xp to next level, progress bar)
function renderSkill(skillName, data) {
  const lvlEl  = document.getElementById(`${skillName}-level`);
  const xpEl   = document.getElementById(`${skillName}-xp`);
  const nextEl = document.getElementById(`${skillName}-xp-next`);
  const barEl  = document.getElementById(`${skillName}-bar`);

  if (!lvlEl || !xpEl || !nextEl || !barEl) return; // skip if elements aren’t present

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

// Render all pieces of data at once
function renderAll() {
  const profile = loadProfile();
  // Strength
  renderSkill("strength", profile.strength);
  // Agility
  renderSkill("agility", profile.agility);
  // GP
  renderGP();
  // Combat Level
  renderCombatLevel();
  // Attack
  renderAttack();
}

// ─────────── Click Handler ───────────

function handleActionClick(event) {
  // 1) Market Upgrade Button? (spend 5 gp → +5 attack)
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
    // Re-render everything
    renderAll();
    return;
  }

  // 2) “Go” button on fight page? (aggregated slider logic)
  const goBtn = event.target.closest("#go-btn");
  if (goBtn) {
    const pushupsSlider = document.getElementById("pushups-slider");
    const squatsSlider  = document.getElementById("squats-slider");
    if (pushupsSlider && squatsSlider) {
      const pushupsCount = parseInt(pushupsSlider.value, 10);
      const squatsCount  = parseInt(squatsSlider.value, 10);

      // Award 2 gp (one for push-ups, one for squats)
      let gp = loadGP();
      gp += 2;
      saveGP(gp);

      // Award Strength XP = pushupsCount + squatsCount
      const totalXP = pushupsCount + squatsCount;
      const profile = loadProfile();
      let { xp, level } = profile.strength;

      xp += totalXP;
      // Level‐up loop
      while (xp >= xpNeededForLevel(level) && level < 99) {
        xp -= xpNeededForLevel(level);
        level += 1;
        if (level === 99) {
          xp = 0; // cap XP at 0 once you hit level 99
          break;
        }
      }
      profile.strength = { xp, level };
      saveProfile(profile);

      // Reset sliders to default (10) and update labels
      pushupsSlider.value = 10;
      squatsSlider.value  = 10;
      document.getElementById("pushups-value").textContent = "10";
      document.getElementById("squats-value").textContent  = "10";
    }
    renderAll();
    return;
  }

  // 3) Exercise or Run Buttons? (data-skill="strength" or "agility")
  const btn = event.target.closest("button[data-skill]");
  if (!btn) return;

  const skill = btn.dataset.skill;           // e.g. "strength" or "agility"
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
        xp = 0; // cap XP at 0 once you hit level 99
        break;
      }
    }
    profile[skill] = { xp, level };
    saveProfile(profile);
  }

  // Re-render everything
  renderAll();
}

// ─────────── Slider Label Updates ───────────
function initSliders() {
  const pushupsSlider = document.getElementById("pushups-slider");
  const squatsSlider  = document.getElementById("squats-slider");

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
}

// ─────────── Initialization on Page Load ───────────

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  initSliders();
  document.body.addEventListener("click", handleActionClick);
});
