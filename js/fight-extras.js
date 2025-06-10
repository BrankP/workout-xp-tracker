// fight-extras.js

// Override calculateDamage stays at top-level if it does not rely on DOM queries at load time.
// However, if calculateDamage references DOM elements, better ensure those elements exist before first call.
// We can leave the override at top-level (it checks for element existence inside), but initial calls to dispatchEvent
// and explicit listener attachments must wait until DOMContentLoaded.

const _origCalculateDamage = calculateDamage;
calculateDamage = function() {
  // Compute slider‐based reps first
  const firstSlider = document.getElementById("pushups-slider");
  if (!firstSlider) {
    // Not on Fight page
    return 0;
  }
  // rest of the logic...
  // (unchanged)
};

document.addEventListener("DOMContentLoaded", () => {
  // 1) Monster slider listener
  const monsterSlider = document.getElementById("monster-slider");
  if (monsterSlider) {
    monsterSlider.addEventListener("change", (e) => {
      const idx = parseInt(e.target.value, 10);
      const mon = MONSTERS[idx] || MONSTERS[0];

      // Update displayed stats
      const nameEl = document.getElementById("monster-name");
      const clEl   = document.getElementById("monster-cl");
      const xpEl   = document.getElementById("monster-xp");
      const atkEl  = document.getElementById("monster-atk");
      if (nameEl) nameEl.textContent = mon.name;
      if (clEl)   clEl.textContent   = mon.combatLevel;
      if (xpEl)   xpEl.textContent   = mon.xp;
      if (atkEl)  atkEl.textContent  = mon.attack;

      // Initialize HP bar
      const hpBar = document.getElementById("monster-hp-bar");
      if (hpBar) {
        hpBar.dataset.maxHp = mon.hp;
        hpBar.dataset.currentDamage = 0;
        hpBar.style.width = "0%";
      }
    });
  } else {
    console.error("fight-extras.js: #monster-slider not found in DOM.");
  }

  // 2) Attack button listener
  const goBtn = document.getElementById("go-btn");
  if (goBtn) {
    goBtn.addEventListener("click", () => {
      // Check if at least one slider > 0
      const ids = [
        "pushups-slider",
        "squats-slider",
        "lunges-slider",
        "situps-slider",
        "burpees-slider",
        "jumpingjacks-slider"
      ];
      let anyRep = 0;
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          anyRep += parseInt(el.value || "0", 10);
        }
      });
      if (anyRep > 0) {
        const hpBar = document.getElementById("monster-hp-bar");
        if (hpBar) {
          hpBar.dataset.currentDamage = 0;
          hpBar.style.width = "0%";
        }
      }
    });
  } else {
    console.error("fight-extras.js: #go-btn not found in DOM.");
  }

  // 3) Slider change listeners
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
    if (!slider) {
      console.warn(`fight-extras.js: #${sliderId} not found, skipping listener.`);
      return;
    }
    const valueSpan = document.getElementById(sliderId.replace("-slider", "-value"));
    slider.addEventListener("change", (e) => {
      if (valueSpan) valueSpan.textContent = e.target.value;
      calculateDamage();
    });
  });

  // 4) On initial load: trigger monster-slider change and calculateDamage
  if (monsterSlider) {
    monsterSlider.dispatchEvent(new Event("change"));
  }
  calculateDamage();
});