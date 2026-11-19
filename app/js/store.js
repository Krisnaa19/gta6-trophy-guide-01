// store.js — saved progress for Leonida Platinum.
// Everything lives in one localStorage key so export/import is one file.
// Nothing here touches the network: the browser is the whole backend.

export const STORAGE_KEY = "leonida-platinum-v1";

export const SOURCES = {
  exo: {
    label: "Exophase",
    note: "official name, description & grade",
    url: "https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/",
  },
  psn: {
    label: "PSNProfiles",
    note: "PSN progress count",
    url: "https://psnprofiles.com/trophies/43531-grand-theft-auto-vi",
  },
  gta: {
    label: "GTABase",
    note: "how-to facts",
    url: "https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series",
  },
};

export const STAGES = [
  { n: 1, title: "Play the story", blurb: "Chapters 1 to 5, in order. Side content as it shows up — and in Chapter 1, do not skip Lucia's balcony meditation (see Positive Mental Attitude)." },
  { n: 2, title: "Character quests", blurb: "The quest lines of Andy, Kenton, Billy, Randy, Tyrone and Bret. Each ends in a trophy; all stay open after the story." },
  { n: 3, title: "Strangers & Freaks", blurb: "Eight qualifying stranger strands across Leonida. None of them count toward 100%, so do them on their own terms." },
  { n: 4, title: "Activities & races", blurb: "Shooting Range golds, drone races, the 20-race set, fishing, arcade, bowling and the rest of the 9 activity types." },
  { n: 5, title: "Robberies & money", blurb: "Bank vaults, armored trucks, jewelry jobs, gang operations, marked bills, garages and the Scooter Bros fleet. Bring a partner." },
  { n: 6, title: "Collectibles & exploration", blurb: "Card sets, WAiNK scans, vehicle scans, meditations, stunts and the full map. The long tail — chip away at it between stages." },
  { n: 7, title: "100% clean-up & platinum", blurb: "Open Progress > Stats > 100% Completion after the story and finish what is left. A Long Road is the last trophy before the platinum." },
];

export function blankState() {
  return {
    earned: {},
    counts: {},
    notes: {},
    settings: { spoilers: true, theme: "night" },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    const state = blankState();
    if (parsed && typeof parsed === "object") {
      if (parsed.earned && typeof parsed.earned === "object") state.earned = parsed.earned;
      if (parsed.counts && typeof parsed.counts === "object") state.counts = parsed.counts;
      if (parsed.notes && typeof parsed.notes === "object") state.notes = parsed.notes;
      if (parsed.settings && typeof parsed.settings === "object") {
        state.settings = { ...state.settings, ...parsed.settings };
      }
    }
    return state;
  } catch (err) {
    return blankState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Storage full or blocked (private mode): progress still works in memory.
  }
}

export function isEarned(state, name) {
  return Boolean(state.earned[name]);
}

export function toggleEarned(state, name) {
  if (state.earned[name]) delete state.earned[name];
  else state.earned[name] = true;
  saveState(state);
  return isEarned(state, name);
}

export function earnedCount(state, trophies) {
  return trophies.filter((t) => isEarned(state, t.name)).length;
}

export function getCount(state, trophy) {
  if (!trophy.target) return 0;
  const v = Number(state.counts[trophy.name]);
  return Number.isFinite(v) ? Math.max(0, Math.min(trophy.target, v)) : 0;
}

export function setCount(state, trophy, value) {
  if (!trophy.target) return 0;
  const v = Math.max(0, Math.min(trophy.target, Math.round(Number(value) || 0)));
  state.counts[trophy.name] = v;
  saveState(state);
  return v;
}

export function bumpCount(state, trophy, delta) {
  return setCount(state, trophy, getCount(state, trophy) + delta);
}

export function getNote(state, name) {
  return typeof state.notes[name] === "string" ? state.notes[name] : "";
}

export function setNote(state, name, text) {
  const trimmed = String(text || "");
  if (trimmed) state.notes[name] = trimmed;
  else delete state.notes[name];
  saveState(state);
}

export function exportState(state) {
  return JSON.stringify(
    { app: "leonida-platinum", version: 1, exportedAt: new Date().toISOString(), state },
    null,
    2,
  );
}

export function importStateText(text) {
  const parsed = JSON.parse(text);
  const inner = parsed && parsed.state ? parsed.state : parsed;
  if (!inner || typeof inner !== "object") throw new Error("not a Leonida Platinum export");
  const state = blankState();
  if (inner.earned && typeof inner.earned === "object") state.earned = inner.earned;
  if (inner.counts && typeof inner.counts === "object") state.counts = inner.counts;
  if (inner.notes && typeof inner.notes === "object") state.notes = inner.notes;
  if (inner.settings && typeof inner.settings === "object") {
    state.settings = { ...state.settings, ...inner.settings };
  }
  return state;
}

export function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
