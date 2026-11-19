// views.js — the tracker list and the trophy detail pane.
// The list is plain buttons: one row a trophy, check on the left, medal
// dot and grade on the right. The detail pane is the guide: official
// description, our own-words guide, its sources, the PSN counter, notes.

import {
  SOURCES,
  isEarned,
  toggleEarned,
  getCount,
  bumpCount,
  getNote,
  setNote,
} from "./store.js";
import { displayName, displayDesc, isMasked } from "./filters.js";

const GRADE_LABEL = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

const KIND_LABEL = {
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  platinum: "Platinum",
  completion: "100%",
};

export function gradeLabel(t) {
  return GRADE_LABEL[t.grade] || t.grade;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tagHtml(t, state) {
  const tags = [`<span class="tag grade-${t.grade}">${gradeLabel(t)}</span>`];
  if (t.kind !== "platinum") tags.push(`<span class="tag">${KIND_LABEL[t.kind] || t.kind}</span>`);
  if (t.missable) tags.push(`<span class="tag missable">Missable</span>`);
  if (t.target) {
    const have = getCount(state, t);
    tags.push(`<span class="tag target">PSN ${have}/${t.target}</span>`);
  }
  if (t.hidden && !isMasked(t, state)) tags.push(`<span class="tag">Hidden on PSN</span>`);
  return tags.join("");
}

export function renderList(listEl, trophies, state, selectedName, onSelect) {
  listEl.innerHTML = "";
  for (const t of trophies) {
    const li = document.createElement("li");
    const earned = isEarned(state, t.name);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `trophy-row${earned ? " earned" : ""}${selectedName === t.name ? " selected" : ""}`;
    btn.setAttribute("aria-pressed", earned ? "true" : "false");
    btn.innerHTML = `
      <span class="medal ${t.grade}" aria-hidden="true"></span>
      <span class="trophy-check" aria-hidden="true">${earned ? "✓" : ""}</span>
      <span class="trophy-body">
        <span class="trophy-name">${esc(displayName(t, state))}</span>
        <span class="trophy-desc">${esc(displayDesc(t, state))}</span>
        <span class="trophy-tags">${tagHtml(t, state)}</span>
      </span>`;
    btn.addEventListener("click", (ev) => {
      // Clicking the check square toggles earned; clicking the row opens it.
      if (ev.target.closest(".trophy-check")) {
        toggleEarned(state, t.name);
        onSelect(t.name, { keepOpen: true });
      } else {
        onSelect(t.name, { keepOpen: true });
      }
    });
    li.appendChild(btn);
    listEl.appendChild(li);
  }
  if (trophies.length === 0) {
    const li = document.createElement("li");
    li.innerHTML = `<p class="view-intro">No trophies match these filters. Clear the search or pick another kind.</p>`;
    listEl.appendChild(li);
  }
}

export function renderDetail(paneEl, trophy, state, onChanged) {
  if (!trophy) {
    paneEl.innerHTML = `<p class="detail-empty">Select a trophy to read its guide, its sources, and your notes.</p>`;
    return;
  }
  const earned = isEarned(state, trophy.name);
  const masked = isMasked(trophy, state);
  const sources = (trophy.sources || ["exo"])
    .map((key) => SOURCES[key])
    .filter(Boolean);

  paneEl.innerHTML = `
    <button class="detail-close" type="button" aria-label="Close guide">×</button>
    <div class="trophy-tags">${tagHtml(trophy, state)}</div>
    <h3>${esc(displayName(trophy, state))}</h3>
    <p class="detail-desc">${esc(displayDesc(trophy, state))}</p>
    ${trophy.missable ? `<p class="detail-missable"><strong>Missable — read this first.</strong> ${esc(trophy.guide.split("POSSIBLY MISSABLE:")[1] || "This is the one trophy that can be missed. Check the guide before you pass its moment.")}</p>` : ""}
    <div class="detail-guide">
      <h4>Guide — our own words</h4>
      <p>${esc(masked ? "Earn this trophy to reveal its guide." : trophy.guide.replace(/POSSIBLY MISSABLE:[^.]*\.\s*/g, ""))}</p>
    </div>
    ${trophy.target ? `
    <div class="detail-counter">
      <h4>Your PSN progress</h4>
      <div class="counter-row">
        <button type="button" data-step="-1" aria-label="Count one less">−</button>
        <span class="counter-value"><span class="counter-have">${getCount(state, trophy)}</span> / ${trophy.target}</span>
        <button type="button" data-step="1" aria-label="Count one more">+</button>
        <button type="button" data-step="5" aria-label="Count five more">+5</button>
      </div>
      <div class="counter-bar"><div style="width:${Math.round((getCount(state, trophy) / trophy.target) * 100)}%"></div></div>
    </div>` : ""}
    <div class="detail-notes">
      <h4>Your notes</h4>
      <textarea placeholder="Where you left off, a spot to return to…" aria-label="Notes for this trophy">${esc(getNote(state, trophy.name))}</textarea>
    </div>
    <p class="detail-sources"><strong>Sources:</strong> ${sources
      .map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label} — ${s.note}</a>`)
      .join("")}</p>
    <p class="detail-sources">Official name, description and grade as PlayStation publishes them. Guide written for this site; where a step is not yet confirmed in the game, the guide says so.</p>`;

  paneEl.querySelector(".detail-close").addEventListener("click", () => {
    renderDetail(paneEl, null, state, onChanged);
    onChanged({ selectionCleared: true });
  });

  paneEl.querySelectorAll(".counter-row button").forEach((b) => {
    b.addEventListener("click", () => {
      bumpCount(state, trophy, Number(b.dataset.step));
      onChanged({ reselected: trophy.name });
    });
  });

  const notes = paneEl.querySelector(".detail-notes textarea");
  if (notes) {
    notes.addEventListener("input", () => setNote(state, trophy.name, notes.value));
  }

  // Earned toggle lives in the detail pane too, as a row under the title.
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "chip";
  toggle.style.marginTop = "12px";
  toggle.textContent = earned ? "✓ Earned — click to unmark" : "Mark as earned";
  toggle.addEventListener("click", () => {
    toggleEarned(state, trophy.name);
    onChanged({ reselected: trophy.name });
  });
  paneEl.appendChild(toggle);
}
