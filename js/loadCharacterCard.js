// js/loadCharacterCard.js

async function loadCharacterCard() {
  try {
    const resp = await fetch("char-card.html");
    if (!resp.ok) throw new Error("Failed to load char-card.html");
    const html = await resp.text();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const card = wrapper.firstElementChild;
    // Prepend into the main content area
    const content = document.querySelector(".content");
    content.insertBefore(card, content.firstChild);

    // Now fill dynamic values:

    // 1) Health: e.g.  current HP / max HP → percentage fill
    const currentHP = /* load from your state, e.g. */ 50;
    const maxHP     = /* e.g. */ 100;
    const hpPct = Math.min(100, (currentHP / maxHP) * 100);
    card.querySelector(".health-bar .fill").style.width = hpPct + "%";

    // 2) XP: total xp / xpNeededForLevel → width
    const strengthXP = /* your state */ 120;
    const strengthLvl= /* your state */ 5;
    const nextXP     = xpNeededForLevel(strengthLvl);
    const xpPct      = Math.min(100, (strengthXP / nextXP) * 100);
    card.querySelector(".xp-bar .fill").style.width = xpPct + "%";

    // 3) Each skill level
    const profile = loadProfile();
    card.querySelector(".strength .lvl").textContent    = profile.strength.level + "/99";
    card.querySelector(".agility  .lvl").textContent    = profile.agility.level  + "/99";
    card.querySelector(".slayer   .lvl").textContent    = profile.slayer.level   + "/99";
    card.querySelector(".constitution .lvl").textContent = profile.strength.level /* or constitution if you track that */ + "/99";

    // 4) GP
    card.querySelector(".gp-count .amount").textContent = loadGP();
  } catch (err) {
    console.error("Error loading character card:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadCharacterCard);
