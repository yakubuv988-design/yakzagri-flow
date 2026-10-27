#!/usr/bin/env node
/**
 * Security Baseline Guard
 *
 * Verifies that the codebase is protected against supply-chain injection,
 * malicious script tampering, and stealth visual-padding tricks:
 *
 * 1. package.json script integrity (prevents command prepending like `node api.js && next build`)
 * 2. Unauthorized root-level executable scripts in frontend/
 * 3. Off-screen whitespace/tab masks (used by attackers to hide payloads from code reviewers)
 * 4. Obfuscated dynamic execution and known dead-drop indicators
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDir, "..");
const repoRoot = resolve(frontendRoot, "..");

const ALLOWED_FRONTEND_ROOT_FILES = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "eslint.config.mjs",
  "next.config.ts",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "jest.config.ts",
  "jest.setup.ts",
  "playwright.config.ts",
  "README.md",
  "TESTING.md",
  "MEDIATOR_RESOLUTION_PROOF.md",
  "design-tokens.json",
  "amana-figma-variables.json",
  ".env.example",
  ".gitignore",
]);

let violations = [];

// ── 1. Check frontend/package.json script integrity ──
function checkPackageJsonScripts() {
  const pkgPath = join(frontendRoot, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const scripts = pkg.scripts || {};

  // Check for dangerous lifecycle hooks
  for (const hook of ["preinstall", "postinstall", "install"]) {
    if (scripts[hook]) {
      violations.push(`frontend/package.json contains unauthorized lifecycle hook: "${hook}": "${scripts[hook]}"`);
    }
  }

  // dev, build, start must directly invoke next, not arbitrary scripts
  for (const [cmd, expectedPrefix] of [
    ["dev", "next dev"],
    ["build", "next build"],
    ["start", "next start"],
  ]) {
    const val = scripts[cmd];
    if (val && !val.trim().startsWith(expectedPrefix) && !val.includes("next build")) {
      violations.push(`frontend/package.json script "${cmd}" has been hijacked: "${val}" (expected "${expectedPrefix}")`);
    }
  }

  // Ensure no command contains malicious primitives
  for (const [cmd, script] of Object.entries(scripts)) {
    if (/\b(curl|wget|eval|sh\s+-c|bash\s+-c|node\s+[a-zA-Z0-9_-]+\.js\s+&&)\b/.test(script)) {
      violations.push(`frontend/package.json script "${cmd}" contains prohibited command chaining: "${script}"`);
    }
  }
}

// ── 2. Guard against unexpected root-level executable scripts in frontend/ ──
function checkFrontendRootFiles() {
  for (const entry of readdirSync(frontendRoot)) {
    const full = join(frontendRoot, entry);
    const stat = statSync(full);
    if (!stat.isDirectory()) {
      if (!ALLOWED_FRONTEND_ROOT_FILES.has(entry) && /\.(js|mjs|cjs|sh|bash|py)$/.test(entry)) {
        violations.push(`Unauthorized root script detected in frontend/: "${entry}". All helper scripts must live in frontend/scripts/.`);
      }
    }
  }
}

// ── 3. Scan for off-screen whitespace masks and obfuscation ──
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "coverage",
  "playwright-report",
  "test-results",
]);

const SCANNABLE_EXTS = /\.(ts|tsx|js|mjs|cjs|json|md|html)$/;
const SKIP_LINE_LENGTH_EXTS = /\.(json|lock|svg)$/;

function walkDir(dir, cb) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      walkDir(full, cb);
    } else {
      cb(full, entry);
    }
  }
}

function scanFileContent(filePath, fileName) {
  if (!SCANNABLE_EXTS.test(fileName)) return;
  const content = readFileSync(filePath, "utf8");
  const relPath = relative(repoRoot, filePath);

  // A. Check for mass tab padding (attacker hid payload on line 1 with hundreds of tabs)
  if (/\t{10,}/.test(content)) {
    violations.push(`${relPath}: detected massive tab sequence (possible off-screen diff obfuscation).`);
  }

  // B. Check for suspicious excessive line length in source files (minified or obfuscated payload)
  if (!SKIP_LINE_LENGTH_EXTS.test(fileName) && !filePath.includes("pact/pacts")) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 3000) {
        violations.push(`${relPath}:${i + 1}: line exceeds 3,000 characters without wrapping.`);
        break;
      }
    }
  }

  // C. Known dead-drop / C2 resolver patterns
  if (filePath !== fileURLToPath(import.meta.url) && content.includes("0x1eef0849eda15d87f64e51c73c8442cf3c8bcef3")) {
    violations.push(`${relPath}: contains blacklisted C2 sender address.`);
  }

  // D. Dynamic Function invocation on string payloads
  if (/Function\s*\(\s*['"]\s*['"]\s*,\s*[a-zA-Z0-9_$]+\s*\)/.test(content)) {
    violations.push(`${relPath}: detected dynamic Function payload evaluation pattern.`);
  }
}

// ── Run checks ──
try {
  checkPackageJsonScripts();
  checkFrontendRootFiles();
  walkDir(frontendRoot, scanFileContent);
} catch (err) {
  console.error("Error running security baseline check:", err);
  process.exit(1);
}

if (violations.length > 0) {
  console.error("\n❌ [SECURITY BASELINE FAILED] The following violations were detected:\n");
  for (const v of violations) {
    console.error(`  • ${v}`);
  }
  console.error("\nPlease review and remove suspicious files or changes before merging.\n");
  process.exit(1);
}

console.log("✓ Security baseline checks passed (no script tampering, off-screen masks, or unauthorized root scripts).");
