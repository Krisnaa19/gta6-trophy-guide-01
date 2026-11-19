// main.js — boot for Leonida Platinum.
// Loads app/data/trophies.json (a file of this app, so it works offline),
// wires the toolbar, tabs, export/import and keyboard shortcuts, and
// renders the tracker. No network request is ever made.

import {
  loadState,
  saveState,
  earnedCount,
  exportState,
  importStateText,
  download,
} from "./store.js";
import { filterTrophies } from "./filters.js";
import { renderList, renderDetail } from "./views.js";
import { renderRoadmap, renderMissables, renderPlanner } from "./roadmap.js";

const VIEWS = ["tracker", "roadmap", "missables", "planner", "about"];

const state = loadState();
let trophies = [];
let selectedName = null;
let query = { kind: "all", grade: "all", earned: "all", search: "" };

const $ = (id) => document.getElementById(id);

function applyTheme() {
  document.documentElement.dataset.theme = state.settings.theme || "night";
  $("theme-toggle").textContent =
    state.settings.theme === "night" ? "Paper theme" : "Night theme";
}

function renderProgress() {
  const earned = earnedCount(state, trophies);
  $("earned-count").textContent = String(earned);
  const pct = trophies.length ? Math.round((earned / trophies.length) * 100) : 0;
  $("progress-fill").style.width = `${pct}%`;
  $("progress-note").textContent =
    earned === trophies.length
      ? "Platinum earned — Leonida Legend!"
      : `${pct}% to the platinum · ${trophies.length - earned} to go`;
  $("missable-count").textContent = String(
    trophies.filter((t) => t.missable && !state.earned[t.name]).length,
  );
}

function renderTracker() {
  const shown = filterTrophies(trophies, state, query);
  renderList($("trophy-list"), shown, state, selectedName, (name) => {
    selectedName = name;
    renderTracker();
    const t = trophies.find((x) => x.name === name);
    renderDetail($("detail-pane"), t, state, refreshAll);
  });
  $("shown-count").textContent = String(shown.length);
  $("earned-shown").textContent = String(
    shown.filter((t) => state.earned[t.name]).length,
  );
  const selected = selectedName ? trophies.find((t) => t.name === selectedName) : null;
  if (selected) renderDetail($("detail-pane"), selected, state, refreshAll);
  renderProgress();
}

function refreshAll(change) {
  if (change && change.selectionCleared) selectedName = null;
  if (change && change.reselected) selectedName = change.reselected;
  saveState(state);
  renderTracker();
  renderRoadmap($("roadmap-stages"), trophies, state, openTrophy);
  renderMissables($("missable-list"), trophies, state, openTrophy);
  renderPlanner($("planner-list"), $("planner-stages"), trophies, state, openTrophy);
}

function openTrophy(name) {
  selectedName = name;
  showView("tracker");
  const t = trophies.find((x) => x.name === name);
  renderDetail($("detail-pane"), t, state, refreshAll);
  renderTracker();
  $("detail-pane").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showView(name) {
  if (!VIEWS.includes(name)) name = "tracker";
  document.querySelectorAll(".tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === name);
  });
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("active", v.id === `view-${name}`);
  });
  $("tracker-toolbar").classList.toggle("hidden", name !== "tracker");
  if (location.hash !== `#${name}`) history.replaceState(null, "", `#${name}`);
}

function wireToolbar() {
  $("search").addEventListener("input", (ev) => {
    query.search = ev.target.value;
    renderTracker();
  });
  $("kind-chips").addEventListener("click", (ev) => {
    const chip = ev.target.closest("[data-kind]");
    if (!chip) return;
    query.kind = chip.dataset.kind;
    document.querySelectorAll("#kind-chips .chip").forEach((c) => {
      c.classList.toggle("active", c === chip);
    });
    renderTracker();
  });
  $("grade-filter").addEventListener("change", (ev) => {
    query.grade = ev.target.value;
    renderTracker();
  });
  $("earned-filter").addEventListener("change", (ev) => {
    query.earned = ev.target.value;
    renderTracker();
  });
  $("spoiler-toggle").checked = Boolean(state.settings.spoilers);
  $("spoiler-toggle").addEventListener("change", (ev) => {
    state.settings.spoilers = ev.target.checked;
    saveState(state);
    renderTracker();
  });
  $("theme-toggle").addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "night" ? "paper" : "night";
    saveState(state);
    applyTheme();
  });
  $("export-btn").addEventListener("click", () => {
    download("leonida-platinum-progress.json", exportState(state));
  });
  $("import-btn").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    try {
      const next = importStateText(await file.text());
      Object.assign(state, next);
      state.settings = { ...state.settings, ...next.settings };
      saveState(state);
      applyTheme();
      $("spoiler-toggle").checked = Boolean(state.settings.spoilers);
      refreshAll();
    } catch (err) {
      alert("That file is not a Leonida Platinum export.");
    }
    ev.target.value = "";
  });
  document.querySelectorAll(".tab").forEach((b) => {
    b.addEventListener("click", () => showView(b.dataset.view));
  });
}

function wireKeys() {
  document.addEventListener("keydown", (ev) => {
    if (ev.target.matches("input, textarea, select")) return;
    if (ev.key === "/") {
      ev.preventDefault();
      showView("tracker");
      $("search").focus();
    } else if (ev.key === "Escape") {
      selectedName = null;
      renderDetail($("detail-pane"), null, state, refreshAll);
      renderTracker();
    } else if (/^[1-5]$/.test(ev.key)) {
      showView(VIEWS[Number(ev.key) - 1]);
    }
  });
}

async function boot() {
  const res = await fetch("data/trophies.json");
  const data = await res.json();
  trophies = data.trophies || data;
  applyTheme();
  wireToolbar();
  wireKeys();
  const initial = (location.hash || "#tracker").slice(1);
  showView(initial);
  refreshAll();
}

boot().catch((err) => {
  document.querySelector("main").innerHTML =
    `<p class="view-intro">The trophy list could not be loaded. Serve this folder with any static file server (for example <code>python3 -m http.server</code> inside app/) and open index.html again.</p>`;
});
