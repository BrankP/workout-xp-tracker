// js/loadCharacterCard.js

async function loadCharacterCard() {
  try {
    const resp = await fetch("char-card.html");
    if (!resp.ok) throw new Error(`Failed to load char-card.html (status ${resp.status})`);
    const html = await resp.text();

    // Parse and inject
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const card = wrapper.firstElementChild;
    document.querySelector(".content").prepend(card);

    // Load profile & GP
    const profile = loadProfile();
    const gp = loadGP();

    // 1) Health bar: use Constitution level / 99, fallback to full
    const conLevel = profile.constitution ? profile.constitution.level : 99;
    const hpPct = Math.min(100, (conLevel / 99) * 100);
    const hpFill = card.querySelector(".health-section .fill");
    if (hpFill) hpFill.style.width = hpPct + "%";

    // 2) XP bar: Strength XP toward next Strength level
    const str = profile.strength;
    const nextXp = xpNeededForLevel(str.level);
    const xpPct = nextXp > 0 ? Math.min(100, (str.xp / nextXp) * 100) : 0;
    const xpFill = card.querySelector(".xp-section .fill");
    if (xpFill) xpFill.style.width = xpPct + "%";

    // 3) Skill levels
    const setters = [
      ["strength",   profile.strength.level],
      ["agility",    profile.agility.level],
      ["slayer",     profile.slayer.level],
      // constitution may not exist – default to 1
      ["constitution", profile.constitution ? profile.constitution.level : 1],
    ];
    setters.forEach(([cls, lvl]) => {
      const el = card.querySelector(`.${cls} .lvl`);
      if (el) el.textContent = `${lvl}/99`;
    });

    // 4) GP amount
    const gpEl = card.querySelector(".gp-count .amount");
    if (gpEl) gpEl.textContent = gp;

  } catch (err) {
    console.error("Error loading character card:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadCharacterCard);