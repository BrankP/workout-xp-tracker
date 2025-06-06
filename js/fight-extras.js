// fight-extras.js

// 1) When the monster slider changes, store maxHP & reset damage to 0, update monster stats
document.getElementById("monster-slider").addEventListener("change", (e) => {
  const idx = parseInt(e.target.value, 10);
  const mon = MONSTERS[idx] || MONSTERS[0];

  // Update stats text
  document.getElementById("monster-name").textContent = mon.name;
  document.getElementById("monster-cl").textContent   = mon.combatLevel;
  document.getElementById("monster-xp").textContent   = mon.xp;
  document.getElementById("monster-atk").textContent  = mon.attack;

  // Store max HP and reset current damage
  const hpBar = document.getElementById("monster-hp-bar");
  hpBar.dataset.maxHp = mon.hp;
  hpBar.dataset.currentDamage = 0;
  hpBar.style.width = "0%";
});

// 2) Override calculateDamage so it also redraws the HP bar
const _origCalculateDamage = calculateDamage;
calculateDamage = function() {
  const totalDamage = _origCalculateDamage();
  const hpBar = document.getElementById("monster-hp-bar");
  if (!hpBar) return totalDamage; // not on Fight page

  const maxHp = parseInt(hpBar.dataset.maxHp || "0", 10);
  if (maxHp > 0) {
    const damagePercent = Math.min(100, Math.floor((totalDamage / maxHp) * 100));
    hpBar.style.width = damagePercent + "%";
  }
  return totalDamage;
};

// 3) Reset HP meter to 0% whenever the Attack button is pressed
document.getElementById("go-btn").addEventListener("click", () => {
  const hpBar = document.getElementById("monster-hp-bar");
  if (hpBar) {
    hpBar.dataset.currentDamage = 0;
    hpBar.style.width = "0%";
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
  // Remove any existing 'input' listeners (if they exist in main.js),
  // then attach a 'change' listener here:
  slider.addEventListener("change", (e) => {
    if (valueSpan) valueSpan.textContent = e.target.value;
    calculateDamage();
  });
});

// 5) On initial load, trigger monster-slider change so HP bar initializes
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("monster-slider").dispatchEvent(new Event("change"));
  // Initial damage (all sliders = 0) → hpBar width is 0%
  calculateDamage();
});
