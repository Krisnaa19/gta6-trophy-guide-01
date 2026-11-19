// filters.js — which trophies the tracker shows, and what the spoiler
// setting hides. Pure functions over (trophies, state, query).

import { isEarned } from "./store.js";

/** A story trophy is spoiler-masked while it is unearned and the setting is on. */
export function isMasked(trophy, state) {
  return Boolean(
    state.settings.spoilers &&
      trophy.hidden &&
      trophy.kind === "story" &&
      !isEarned(state, trophy.name),
  );
}

/** Display name/description: masked story trophies show a placeholder. */
export function displayName(trophy, state) {
  return isMasked(trophy, state) ? "Hidden trophy" : trophy.name;
}

export function displayDesc(trophy, state) {
  return isMasked(trophy, state)
    ? "A story trophy. Earn it to reveal its name and description."
    : trophy.desc;
}

export function filterTrophies(trophies, state, query) {
  const q = (query.search || "").trim().toLowerCase();
  return trophies.filter((t) => {
    if (query.kind === "missable" && !t.missable) return false;
    if (query.kind && query.kind !== "all" && query.kind !== "missable" && t.kind !== query.kind) {
      return false;
    }
    if (query.grade !== "all" && t.grade !== query.grade) return false;
    if (query.earned === "earned" && !isEarned(state, t.name)) return false;
    if (query.earned === "unearned" && isEarned(state, t.name)) return false;
    if (q) {
      const hay = `${t.name} ${t.desc} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Roadmap stage progress: earned / total per stage. */
export function stageProgress(trophies, state) {
  const out = new Map();
  for (const t of trophies) {
    const s = out.get(t.stage) || { total: 0, earned: 0 };
    s.total += 1;
    if (isEarned(state, t.name)) s.earned += 1;
    out.set(t.stage, s);
  }
  return out;
}

/**
 * Next-up planner: unfinished story trophies first (in roadmap order),
 * then the counted trophies closest to their PSN target, then the next
 * roadmap stage's first unfinished trophy. Returns at most `limit` picks
 * with a one-line reason each.
 */
export function planNext(trophies, state, limit = 3) {
  const undone = trophies.filter((t) => !isEarned(state, t.name));
  const picks = [];
  const take = (t, why) => {
    if (t && picks.length < limit && !picks.some((p) => p.trophy.name === t.name)) {
      picks.push({ trophy: t, why });
    }
  };

  const story = undone
    .filter((t) => t.kind === "story")
    .sort((a, b) => a.stage - b.stage || trophies.indexOf(a) - trophies.indexOf(b));
  take(story[0], "Next in the story — finish the chapter or quest it belongs to.");

  const counted = undone
    .filter((t) => t.target)
    .map((t) => {
      const have = Number(state.counts[t.name]) || 0;
      return { t, left: t.target - have, ratio: have / t.target };
    })
    .sort((a, b) => b.ratio - a.ratio || a.left - b.left);
  if (counted[0] && counted[0].ratio > 0) {
    take(counted[0].t, `Closest to done: ${counted[0].t.target - counted[0].left} of ${counted[0].t.target} already counted.`);
  }

  const byStage = [...undone].sort((a, b) => a.stage - b.stage);
  take(byStage[0], "First unfinished trophy of your next roadmap stage.");
  take(byStage[1], "Next after that in the same stage.");

  return picks.slice(0, limit);
}
