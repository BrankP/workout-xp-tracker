// fight-extras.js

// 1) When the monster slider changes, store maxHP and reset damage to 0
document.getElementById("monster-slider").addEventListener("change", (e) => {
  const idx = parseInt(e.target.value, 10);
  const mon = MONSTERS[idx] || MONSTERS[0];

  const hpBar = document.getElementById("monster-hp-bar");
  hpBar.dataset.maxHp = mon.hp;
  hpBar.dataset.currentDamage = 0;
  hpBar.style.width = "0%";

  // Also update other stat displays:
  document.getElementById("monster-name").textContent = mon.name;
  document.getElementById("monster-cl").textContent   = mon.combatLevel;
  document.getElementById("monster-xp").textContent   = mon.xp;
  document.getElementById("monster-atk").textContent  = mon.attack;
});

// 2) Override calculateDamage so it also redraws the HP bar
const _origCalculateDamage = calculateDamage;
calculateDamage = function() {
  const totalDamage = _origCalculateDamage();
  const hpBar = document.getElementById("monster-hp-bar");
  if (!hpBar) return totalDamage;

  const maxHp = parseInt(hpBar.dataset.maxHp || "0", 10);
  if (maxHp > 0) {
    const percent = Math.min(100, Math.floor((totalDamage / maxHp) * 100));
    hpBar.style.width = percent + "%";
  }
  return totalDamage;
};

// 3) On page load (DOMContentLoaded), initialize the bar for the default monster (index 0)
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("monster-slider").dispatchEvent(new Event("change"));
  calculateDamage();
});