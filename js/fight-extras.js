// fight-extras.js

// 1) When the monster slider changes:
//    • Update monster stats text
//    • Store max HP and reset damage to 0
document.getElementById("monster-slider").addEventListener("change", (e) => {
  const idx = parseInt(e.target.value, 10);
  const mon = MONSTERS[idx] || MONSTERS[0];

  // Update displayed stats
  document.getElementById("monster-name").textContent = mon.name;
  document.getElementById("monster-cl").textContent   = mon.combatLevel;
  document.getElementById("monster-xp").textContent   = mon.xp;
  document.getElementById("monster-atk").textContent  = mon.attack;

  // Initialize HP bar
  const hpBar = document.getElementById("monster-hp-bar");
  hpBar.dataset.maxHp = mon.hp;
  hpBar.dataset.currentDamage = 0;
  hpBar.style.width = "0%";
});

// 2) Override calculateDamage so it:
//    • Calculates sliderDamage first
//    • Only adds userAttack if sliderDamage > 0
//    • Updates the HP bar accordingly
const _origCalculateDamage = calculateDamage;
calculateDamage = function() {
  // Compute slider‐based reps first
  const firstSlider = document.getElementById("pushups-slider");
  if (!firstSlider) {
    // Not on Fight page
    return 0;
  }

  const pushups      = parseInt(firstSlider.value, 10);
  const squats       = parseInt(document.getElementById("squats-slider").value, 10);
  const lunges       = parseInt(document.getElementById("lunges-slider").value, 10);
  const situps       = parseInt(document.getElementById("situps-slider").value, 10);
  const burpees      = parseInt(document.getElementById("burpees-slider").value, 10);
  const jumpingjacks = parseInt(document.getElementById("jumpingjacks-slider").value, 10);

  const totalReps   = pushups + squats + lunges + situps + burpees + jumpingjacks;
  const sliderDamage = totalReps > 0 ? totalReps / 10 : 0;
  const userAttack   = loadAttack();

  // Only allow damage if sliderDamage > 0
  const totalDamage = sliderDamage > 0 ? sliderDamage + userAttack : 0;

  // Update display text for Damage: show sliderDamage and userAttack only if sliderDamage>0
  const dmgEl = document.getElementById("damage-value");
  if (dmgEl) {
    if (sliderDamage > 0) {
      dmgEl.textContent = `${sliderDamage} (+${userAttack})`;
    } else {
      dmgEl.textContent = `0 (+0)`;
    }
  }

  // Update HP bar overlay
  const hpBar = document.getElementById("monster-hp-bar");
  if (hpBar) {
    const maxHp = parseInt(hpBar.dataset.maxHp || "0", 10);
    if (maxHp > 0) {
      const damagePercent = Math.min(100, Math.floor((totalDamage / maxHp) * 100));
      hpBar.style.width = damagePercent + "%";
    }
  }

  return totalDamage;
};

// 3) Reset HP meter to 0% whenever the Attack button is pressed,
//    but only if some reps were chosen (sliderDamage > 0). Otherwise
//    leave it at 0%.
document.getElementById("go-btn").addEventListener("click", () => {
  // Check if at least one slider > 0
  const anyRep =
    parseInt(document.getElementById("pushups-slider").value, 10) +
    parseInt(document.getElementById("squats-slider").value, 10) +
    parseInt(document.getElementById("lunges-slider").value, 10) +
    parseInt(document.getElementById("situps-slider").value, 10) +
    parseInt(document.getElementById("burpees-slider").value, 10) +
    parseInt(document.getElementById("jumpingjacks-slider").value, 10);

  if (anyRep > 0) {
    // Clear the HP bar fully on each Attack
    const hpBar = document.getElementById("monster-hp-bar");
    if (hpBar) {
      hpBar.dataset.currentDamage = 0;
      hpBar.style.width = "0%";
    }
  }
});

// 4) Switch all exercise sliders to update only on 'change' (not 'input')
//    and update their labels + recalc damage
const sliderIds = [
  "pushups-slider",
  "squats-slider",
  "lunges-slider",
  "situps-slider",
  "burpees-slider",
  "jumpingjacks-slider"
];
sliderIds.forEach((sliderId) => {
  const slider = document.getElementById(sliderId);
  if (!slider) return;
  const valueSpan = document.getElementById(sliderId.replace("-slider", "-value"));
  slider.addEventListener("change", (e) => {
    if (valueSpan) valueSpan.textContent = e.target.value;
    calculateDamage();
  });
});

// 5) On initial load, trigger monster-slider change so HP bar initializes,
//    and run calculateDamage once
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("monster-slider").dispatchEvent(new Event("change"));
  calculateDamage();
});