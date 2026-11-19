// main.ts — hands the Leonida Platinum guide in.
//
// Copies app/ (the guide) and screenshots/ (its renders) from this
// repository into the output directory, then writes dossier.json with
// buildDossier from vendor/makefun-frontend.ts, the kit's library.
//
// The grader runs this twice in a fresh container with no network, the
// repository read-only at /bot and a writable /output; outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The gate's caps for this bounty: the dossier text, the screenshots,
// and the app's size limits, as the competition's gate holds them.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return n;
}

function main(): void {
  const repoRoot = dirname(fileURLToPath(import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

  const appSrc = join(repoRoot, "app");
  const shotsSrc = join(repoRoot, "screenshots");
  const appDst = join(outDir, "app");
  const shotsDst = join(outDir, "screenshots");

  // Fail fast with a plain message when the guide is incomplete, instead
  // of letting buildDossier refuse it with a cap error.
  if (!existsSync(join(appSrc, "index.html"))) {
    throw new Error("main.ts: app/index.html is missing");
  }
  if (!existsSync(join(appSrc, "data", "trophies.json"))) {
    throw new Error("main.ts: app/data/trophies.json is missing");
  }
  const shotFiles = readdirSync(shotsSrc).filter((f) => !f.startsWith("."));
  if (shotFiles.length < 3 || shotFiles.length > 4) {
    throw new Error(
      `main.ts: screenshots/ must hold 3 or 4 images, found ${shotFiles.length}`,
    );
  }
  for (const f of shotFiles) {
    if (statSync(join(shotsSrc, f)).size > 256 * 1024) {
      throw new Error(`main.ts: screenshot ${f} is over the 256 KiB cap`);
    }
  }

  mkdirSync(outDir, { recursive: true });
  rmSync(appDst, { recursive: true, force: true });
  rmSync(shotsDst, { recursive: true, force: true });
  cpSync(appSrc, appDst, { recursive: true });
  cpSync(shotsSrc, shotsDst, { recursive: true });

  const dossier = buildDossier(outDir, CAPS);
  writeFileSync(join(outDir, "dossier.json"), dossier);

  const shots = readdirSync(shotsDst).filter((f) => !f.startsWith(".")).length;
  console.log(
    `leonida-platinum: app/ ${countFiles(appDst)} files, ` +
      `screenshots/ ${shots} images, dossier.json ${dossier.length} bytes`,
  );
}

main();
