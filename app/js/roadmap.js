// roadmap.js — the roadmap stages, the missables page and the Next-up
// planner. All three are built from the same trophy data and the same
// saved progress, so they can never disagree with the tracker.

import { STAGES, isEarned } from "./store.js";
import { stageProgress, planNext } from "./filters.js";
import { gradeLabel } from "./views.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderRoadmap(container, trophies, state, onOpen) {
  const progress = stageProgress(trophies, state);
  container.innerHTML = "";
  for (const stage of STAGES) {
    const p = progress.get(stage.n) || { total: 0, earned: 0 };
    const members = trophies.filter((t) => t.stage === stage.n);
    const pct = p.total ? Math.round((p.earned / p.total) * 100) : 0;
    const div = document.createElement("div");
    div.className = "stage";
    div.innerHTML = `
      <div class="stage-head">
        <span class="stage-num">Stage ${stage.n}</span>
        <h3>${esc(stage.title)}</h3>
        <span class="stage-count">${p.earned} / ${p.total} earned · ${pct}%</span>
      </div>
      <p>${esc(stage.blurb)}</p>
      <div class="stage-bar"><div style="width:${pct}%"></div></div>
      <div class="trophy-tags">
        ${members.map((t) => `<button class="tag grade-${t.grade}" type="button" data-name="${esc(t.name)}" title="${esc(t.desc)}">${esc(t.name)}${isEarned(state, t.name) ? " ✓" : ""}</button>`).join("")}
      </div>`;
    div.querySelectorAll("[data-name]").forEach((b) => {
      b.addEventListener("click", () => onOpen(b.dataset.name));
    });
    container.appendChild(div);
  }
}

export function renderMissables(container, trophies, state, onOpen) {
  container.innerHTML = "";
  const missable = trophies.filter((t) => t.missable);
  for (const t of missable) {
    const div = document.createElement("div");
    div.className = "stage";
    div.innerHTML = `
      <div class="stage-head">
        <span class="stage-num">⚠</span>
        <h3>${esc(t.name)}</h3>
        <span class="stage-count">${gradeLabel(t)} · ${isEarned(state, t.name) ? "earned ✓" : "not earned yet"}</span>
      </div>
      <p>${esc(t.desc)}</p>
      <p><strong>Why it can be missed:</strong> ${esc((t.guide.split("POSSIBLY MISSABLE:")[1] || "See the guide.").trim())}</p>
      <div class="trophy-tags">
        <button class="tag" type="button" data-name="${esc(t.name)}">Read the full guide →</button>
      </div>`;
    div.querySelector("[data-name]").addEventListener("click", () => onOpen(t.name));
    container.appendChild(div);
  }
  const note = document.createElement("p");
  note.className = "view-intro";
  note.textContent = "That is the whole list: 1 of 55. Every other trophy is safe to chase after the credits, in free roam.";
  container.appendChild(note);
}

export function renderPlanner(listEl, stagesEl, trophies, state, onOpen) {
  listEl.innerHTML = "";
  const picks = planNext(trophies, state, 3);
  if (picks.length === 0) {
    listEl.innerHTML = `<p class="view-intro">Everything is earned — the platinum should be yours. Congratulations, Leonida Legend.</p>`;
  }
  picks.forEach((pick, i) => {
    const t = pick.trophy;
    const div = document.createElement("div");
    div.className = "planner-card";
    div.innerHTML = `
      <span class="planner-rank">${i + 1}</span>
      <div>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.desc)} · ${gradeLabel(t)} · Stage ${t.stage}</p>
        <p class="why">${esc(pick.why)}</p>
      </div>
      <button type="button" data-name="${esc(t.name)}">Open guide</button>`;
    div.querySelector("[data-name]").addEventListener("click", () => onOpen(t.name));
    listEl.appendChild(div);
  });

  stagesEl.innerHTML = "";
  const progress = stageProgress(trophies, state);
  for (const stage of STAGES) {
    const p = progress.get(stage.n) || { total: 0, earned: 0 };
    const pct = p.total ? Math.round((p.earned / p.total) * 100) : 0;
    const div = document.createElement("div");
    div.className = "stage";
    div.innerHTML = `
      <div class="stage-head">
        <span class="stage-num">Stage ${stage.n}</span>
        <h3>${esc(stage.title)}</h3>
        <span class="stage-count">${p.earned} / ${p.total} · ${pct}%</span>
      </div>
      <div class="stage-bar"><div style="width:${pct}%"></div></div>`;
    stagesEl.appendChild(div);
  }
}
