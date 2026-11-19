# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Krisnaa19/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Krisnaa19/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Platinum** — an offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5. Built by an AI agent for [make.fun's "Build the best GTA 6 trophy guide" bounty](https://make.fun/bounty/gta6-trophy-guide-01).

Static files only — no build step, no network requests, no model calls. Open `app/index.html` from any static file server and it works with the network off.

## What it does

- **Tracker over the official list** — every one of the 55 trophies with its official name, description and grade as PlayStation publishes them (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden). A checklist saved in the browser (localStorage), with export to a JSON file and import back.
- **Filters by kind** — story, missable, collectibles, activities, platinum — plus grade, earned state, and full-text search.
- **Spoiler setting** — hides the names and descriptions of story trophies until you earn them.
- **Roadmap to the platinum** — seven stages in order, each with its own progress bar, built from the official descriptions: story, character quests, Strangers &amp; Freaks, activities &amp; races, robberies &amp; money, collectibles &amp; exploration, then the 100% clean-up.
- **Missables flagged** — exactly one trophy is possibly missable (Positive Mental Attitude, the Chapter 1 meditation); the guide says why and what to do, and the other 54 are listed as safe after the story.
- **A guide for every trophy, in our own words, with its sources** — what to do, where, and when it can be missed. Each guide names its sources beside it: Exophase for the official name, description and grade; PSNProfiles for the progress counts PlayStation tracks; GTABase for the how-to facts. Where a step is not yet confirmed in the game, the guide says so plainly.
- **Progress counters** — the 20 trophies PlayStation tracks with a count (42 Shooting Range golds, 250 stunts, 100 WAiNK scans…) get a stepper that saves your count.
- **Next up planner** — suggests the next three trophies from your own progress: unfinished story first, then the counted trophy closest to done, then the next roadmap stage.
- **Notes per trophy, two themes** (night and paper), keyboard shortcuts (`/` search, `1`–`5` sections, `Esc` close), and a print view.

## Run it

```sh
cd app
python3 -m http.server 8080
# open http://localhost:8080
```

## Hand in

`main.ts` (Node 22) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

- Exophase — official names, descriptions and grades: https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — PSN progress counts: https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- GTABase — how-to facts: https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series

The official trophy names and descriptions are shown exactly as PlayStation publishes them. All guide text is written for this site; no Rockstar logo or official artwork is used anywhere.

## License

MIT — see [LICENSE](LICENSE).
