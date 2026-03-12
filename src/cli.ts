#!/usr/bin/env node

/**
 * clawclawgo — Cyberware manager for AI agents
 *
 * Commands:
 *   export   Export your current rig as a loadout
 *   diff     Compare your rig to another loadout
 *   inspect  View a loadout file
 */

import { readFile, writeFile } from "node:fs/promises";
import { exportLoadout } from "./export.js";
import { diffLoadouts } from "./diff.js";
import { displayLoadout, displayDiff } from "./display.js";
import type { Loadout } from "./schema/loadout.js";

const args = process.argv.slice(2);
const command = args[0];

async function loadFromFile(path: string): Promise<Loadout> {
  const raw = await readFile(path, "utf-8");
  // Support both JSON and YAML-ish (JSON for now)
  return JSON.parse(raw);
}

async function cmdExport() {
  const outFile = args.find((a) => !a.startsWith("-")) === "export"
    ? args[1]
    : undefined;
  const name = args.find((a) => a.startsWith("--name="))?.split("=")[1];
  const author = args.find((a) => a.startsWith("--author="))?.split("=")[1];
  const tags = args
    .find((a) => a.startsWith("--tags="))
    ?.split("=")[1]
    ?.split(",");
  const description = args
    .find((a) => a.startsWith("--description="))
    ?.split("=")[1];

  const loadout = await exportLoadout({ name, author, tags, description });

  // Display to terminal
  console.log(displayLoadout(loadout));

  // Write to file if specified
  const outputPath = outFile || "loadout.json";
  if (outFile || args.includes("--save")) {
    await writeFile(outputPath, JSON.stringify(loadout, null, 2));
    console.log(`  Saved to ${outputPath}\n`);
  }

  // Always write to default location
  if (!outFile) {
    await writeFile(outputPath, JSON.stringify(loadout, null, 2));
    console.log(`  Saved to ${outputPath}\n`);
  }
}

async function cmdDiff() {
  const theirFile = args[1];
  if (!theirFile) {
    console.error("Usage: clawclawgo diff <loadout.json>");
    process.exit(1);
  }

  const yours = await exportLoadout();
  const theirs = await loadFromFile(theirFile);
  const diff = diffLoadouts(yours, theirs);

  console.log(displayDiff(diff));
}

async function cmdInspect() {
  const file = args[1];
  if (!file) {
    console.error("Usage: clawclawgo inspect <loadout.json>");
    process.exit(1);
  }

  const loadout = await loadFromFile(file);
  console.log(displayLoadout(loadout));
}

async function cmdHelp() {
  console.log(`
  ${"\x1b[1m"}clawclawgo${"\x1b[0m"} — Cyberware manager for AI agents

  Commands:
    export [file]     Export your current rig as a loadout
    diff <file>       Compare your rig to another loadout
    inspect <file>    View a loadout file
    help              Show this help

  Options (export):
    --name=NAME         Loadout display name
    --author=AUTHOR     Author identifier
    --tags=a,b,c        Discovery tags
    --description=TEXT  Freeform description
    --save              Save to loadout.json
`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  switch (command) {
    case "export":
      await cmdExport();
      break;
    case "diff":
      await cmdDiff();
      break;
    case "inspect":
      await cmdInspect();
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      await cmdHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      await cmdHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
