#!/usr/bin/env node

/**
 * clawclawgo - Build manager for AI agents
 *
 * Commands:
 *   export   Export your current agent as a build
 *   diff     Compare your agent to another build
 *   inspect  View a build file
 */

import { readFile, writeFile } from "node:fs/promises";
import { exportBuild } from "./export.js";
import { diffBuilds } from "./diff.js";
import { displayBuild, displayDiff } from "./display.js";
import { validate } from "./validate.js";
import type { Build } from "./schema/build.js";

const args = process.argv.slice(2);
const command = args[0];

async function loadFromFile(path: string): Promise<Build> {
  const raw = await readFile(path, "utf-8");
  const data = JSON.parse(raw);
  
  // Validate the build
  const result = validate(data);
  if (!result.valid) {
    console.error("❌ Invalid build file:");
    for (const err of result.errors) {
      console.error(`   ${err.field}: ${err.message}`);
    }
    process.exit(1);
  }
  
  return data as Build;
}

async function cmdExport() {
  const outFile =
    args.find((a) => !a.startsWith("-")) === "export"
      ? args[1]
      : undefined;
  const name = args
    .find((a) => a.startsWith("--name="))
    ?.split("=")[1];
  const author = args
    .find((a) => a.startsWith("--author="))
    ?.split("=")[1];
  const tags = args
    .find((a) => a.startsWith("--tags="))
    ?.split("=")[1]
    ?.split(",");
  const description = args
    .find((a) => a.startsWith("--description="))
    ?.split("=")[1];

  const build = await exportBuild({ name, author, tags, description });

  // Display to terminal
  console.log(displayBuild(build));

  // Write to file if specified
  const outputPath = outFile || "build.json";
  await writeFile(outputPath, JSON.stringify(build, null, 2));
  console.log(`  Saved to ${outputPath}\n`);
}

async function cmdDiff() {
  const theirFile = args[1];
  if (!theirFile) {
    console.error("Usage: clawclawgo diff <build.json>");
    process.exit(1);
  }

  const yours = await exportBuild();
  const theirs = await loadFromFile(theirFile);
  const diff = diffBuilds(yours, theirs);

  console.log(displayDiff(diff));
}

async function cmdInspect() {
  const file = args[1];
  if (!file) {
    console.error("Usage: clawclawgo inspect <build.json>");
    process.exit(1);
  }

  const build = await loadFromFile(file);
  console.log(displayBuild(build));
}

async function cmdHelp() {
  console.log(`
  ${"\x1b[1m"}clawclawgo${"\x1b[0m"} - Build manager for AI agents

  Commands:
    export [file]     Export your current agent as a build
    diff <file>       Compare your agent to another build
    inspect <file>    View a build file
    help              Show this help

  Options (export):
    --name=NAME         Build display name
    --author=AUTHOR     Author identifier
    --tags=a,b,c        Discovery tags
    --description=TEXT  Freeform description
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
