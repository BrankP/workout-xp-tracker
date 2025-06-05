// main.js

// ─────────── 1) MONSTERS ARRAY ───────────
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

// ─────────── 2) XP CURVE ───────────
function xpNeededForLevel(level) {
  if (level <= 1) return 83;
  let xp = 83;
  for (let lv = 2; lv <= level; lv++) {
    xp = Math.floor(xp * 1.1040909);
  }
  return xp;
}
function computeCombatLevel(totalXP) {
  for (let lvl = 1; lvl <= 99; lvl++) {
    if (xpNeededForLevel(lvl) > totalXP) {
      return lvl;
    }
  }
  return 99;
}

// ─────────── 3) DEFAULT PROFILE ───────────
const DEFAULT_PROFILE = {
  strength: { xp: 0, level: 1 },
  agility:  { xp: 0, level: 1 },
  slayer:   { xp: 0, level: 1 },
};

// ─────────── 4) STORAGE KEYS ───────────
const PROFILE_KEY = "workoutProfile";
const GP_KEY      = "workoutGP";
const ATTACK_KEY  = "workoutAttack";

// ─────────── 5) LOAD / SAVE PROFILE ───────────
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

// ─────────── 6) LOAD / SAVE GP ───────────
function loadGP() {
  const raw = localStorage.getItem(GP_KEY);
  return raw ? parseInt(raw, 10) : 0;
}
function saveGP(gp) {
  localStorage.setItem(GP_KEY, gp);
}

// ─────────── 7) LOAD / SAVE ATTACK ───────────
function loadAttack() {
  const raw = localStorage.getItem(ATTACK_KEY);
  return raw ? parseInt(raw, 10) : 1;
}
function saveAttack(atk) {
  localStorage.setItem(ATTACK_KEY, atk);
}

// ─────────── 8) RENDERING FUNCTIONS ───────────
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

function renderGP() {
  const el = document.getElementById("gp-count");
  if (!el) return;
  el.textContent = loadGP();
}

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

function renderAttack() {
  const el = document.getElementById("attack-count");
  if (!el) return;
  el.textContent = loadAttack();
}

function renderAll() {
  const profile = loadProfile();
  renderSkill("strength", profile.strength);
  renderSkill("agility",  profile.agility);
  renderSkill("slayer",   profile.slayer);
  renderGP();
  renderCombatLevel();
  renderAttack();
}

// ─────────── 9) CALCULATE DAMAGE: sliderDamage + userAttack ───────────
function calculateDamage() {
  const pushups      = parseInt(document.getElementById("pushups-slider").value, 10);
  const squats       = parseInt(document.getElementById("squats-slider").value, 10);
  const lunges       = parseInt(document.getElementById("lunges-slider").value, 10);
  const situps       = parseInt(document.getElementById("situps-slider").value, 10);
  const burpees      = parseInt(document.getElementById("burpees-slider").value, 10);
  const jumpingjacks = parseInt(document.getElementById("jumpingjacks-slider").value, 10);

  const sliderReps   = pushups + squats + lunges + situps + burpees + jumpingjacks;
  const sliderDamage = sliderReps / 10;          // each 10 reps = 1 damage
  const userAttack   = loadAttack();             // fetch user’s Attack stat

  // Update the display to show "sliderDamage (+ userAttack)"
  const dmgEl = document.getElementById("damage-value");
  if (dmgEl) {
    dmgEl.textContent = `${sliderDamage} (+${userAttack})`;
  }

  return sliderDamage + userAttack; // return combined damage
}

// ─────────── 10) CLICK HANDLER ───────────
function handleActionClick(event) {
  // 10a) Market “Upgrade Weapon” button
  const upgradeBtn = event.target.closest("#upgrade-btn");
    if (upgradeBtn) {
      let gp = loadGP();
      console.log("DEBUG: current GP =", gp); // see what loadGP() is returning
    
      if (gp >= 5) {
        // Spend 5 gp, gain +5 Attack
        gp -= 5;
        saveGP(gp);
    
        let atk = loadAttack();
        atk += 5;
        saveAttack(atk);
    
        console.log("DEBUG: spent 5 gp → new GP =", gp, "new Attack =", atk);
      } else {
        alert(`Not enough gp to upgrade! You currently have only ${gp} gp.`);
      }
    
      renderAll();
      return;
  }

  // 10b) Attack Button on Fight Page
  const goBtn = event.target.closest("#go-btn");
  if (goBtn) {
    const p = document.getElementById("pushups-slider");
    const s = document.getElementById("squats-slider");
    const l = document.getElementById("lunges-slider");
    const si= document.getElementById("situps-slider");
    const b = document.getElementById("burpees-slider");
    const j = document.getElementById("jumpingjacks-slider");
    const m = document.getElementById("monster-slider");

    if (p && s && l && si && b && j && m) {
      // 1) Determine selected monster
      const monsterIndex = parseInt(m.value, 10);
      const monster      = MONSTERS[monsterIndex] || MONSTERS[0];

      // 2) Compute combined damage (sliderDamage + userAttack)
      const totalDamage = calculateDamage();

      // 3) Award GP: +6 for the six exercise sliders
      let gp = loadGP();
      gp += 6;

      // If monster is defeated, give +1 gp for monster defeat
      if (totalDamage >= monster.hp) {
        gp += 1;
      }
      saveGP(gp);

      // 4) Award Strength XP = sum of all reps
      const repXP =
        parseInt(p.value, 10) +
        parseInt(s.value, 10) +
        parseInt(l.value, 10) +
        parseInt(si.value, 10) +
        parseInt(b.value, 10) +
        parseInt(j.value, 10);

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

      // 5) If monster is defeated, award monster.xp to Slayer
      if (totalDamage >= monster.hp) {
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

      saveProfile(profile);

      // 6) Reset all six exercise sliders to 0 (and update their labels)
      p.value = 0;  document.getElementById("pushups-value").textContent      = "0";
      s.value = 0;  document.getElementById("squats-value").textContent       = "0";
      l.value = 0;  document.getElementById("lunges-value").textContent       = "0";
      si.value= 0;  document.getElementById("situps-value").textContent       = "0";
      b.value = 0;  document.getElementById("burpees-value").textContent      = "0";
      j.value = 0;  document.getElementById("jumpingjacks-value").textContent = "0";

      // 7) Reset monster slider to index 0 (Chicken) & update stats
      m.value = 0;
      document.getElementById("monster-name").textContent = MONSTERS[0].name;
      document.getElementById("monster-cl").textContent   = MONSTERS[0].combatLevel;
      document.getElementById("monster-hp").textContent   = MONSTERS[0].hp;
      document.getElementById("monster-xp").textContent   = MONSTERS[0].xp;
      document.getElementById("monster-atk").textContent  = MONSTERS[0].attack;

      // 8) Recalculate Damage display (now all sliders are 0 → sliderDamage = 0; plus userAttack remains)
      calculateDamage();
    }

    renderAll();
    return;
  }

  // 10c) “data-skill” buttons (Run‐page and any future buttons)
  const btn = event.target.closest("button[data-skill]");
  if (!btn) return;

  const skill = btn.dataset.skill;
  const bonus = parseInt(btn.dataset.xp, 10);

  // Award 1 gp for each click
  let gp2 = loadGP();
  gp2 += 1;
  saveGP(gp2);

  // Award XP & handle level‐ups for that skill
  const profile2 = loadProfile();
  let { xp, level } = profile2[skill];
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
    profile2[skill] = { xp, level };
    saveProfile(profile2);
  }

  renderAll();
}

// ─────────── 11) INITIALIZE SLIDERS & MONSTER ───────────
function initSlidersAndMonster() {
  const pushupsSlider      = document.getElementById("pushups-slider");
  const squatsSlider       = document.getElementById("squats-slider");
  const lungesSlider       = document.getElementById("lunges-slider");
  const situpsSlider       = document.getElementById("situps-slider");
  const burpeesSlider      = document.getElementById("burpees-slider");
  const jumpingjacksSlider = document.getElementById("jumpingjacks-slider");
  const monsterSlider      = document.getElementById("monster-slider");

  // Helper to attach an 'input' listener to each exercise slider
  function attachLabelListener(sliderId, labelId) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    slider.addEventListener("input", (e) => {
      const valSpan = document.getElementById(labelId);
      if (valSpan) valSpan.textContent = e.target.value;
      calculateDamage();
    });
  }

  attachLabelListener("pushups-slider",      "pushups-value");
  attachLabelListener("squats-slider",       "squats-value");
  attachLabelListener("lunges-slider",       "lunges-value");
  attachLabelListener("situps-slider",       "situps-value");
  attachLabelListener("burpees-slider",      "burpees-value");
  attachLabelListener("jumpingjacks-slider", "jumpingjacks-value");

  // Monster slider updates name & stats on 'change' only
  if (monsterSlider) {
    monsterSlider.addEventListener("change", (e) => {
      const idx = parseInt(e.target.value, 10);
      const mon = MONSTERS[idx] || MONSTERS[0];

      const nameSpan = document.getElementById("monster-name");
      if (nameSpan) nameSpan.textContent = mon.name;

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

  // Initialize damage display on-load (all sliders=0 → sliderDamage=0)
  calculateDamage();
}

// ─────────── 12) ON PAGE LOAD ───────────
document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  initSlidersAndMonster();
  document.body.addEventListener("click", handleActionClick);
});
