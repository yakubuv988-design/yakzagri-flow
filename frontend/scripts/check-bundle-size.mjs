#!/usr/bin/env node
// Enforces a maximum client bundle size budget after `next build`.
// Usage: node scripts/check-bundle-size.mjs [--budget-kb=2048] [--json=out.json] [--baseline=base.json] [--threshold-kb=15]
// Reads the Next.js build manifest to sum the size of client JS chunks.
// With --json it writes per-route sizes; with --baseline it compares against a
// previously captured report and warns when any route grows past the threshold.

import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const nextDir = join(projectRoot, '.next');

const DEFAULT_BUDGET_KB = 2048;
const DEFAULT_THRESHOLD_KB = 15;

function parseArg(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : undefined;
}

function parseBudget() {
  const value = Number(parseArg('budget-kb'));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_BUDGET_KB;
}

function parseThreshold() {
  const value = Number(parseArg('threshold-kb'));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_THRESHOLD_KB;
}

function collectChunkFiles(manifest) {
  const files = new Set();
  for (const entry of Object.values(manifest)) {
    if (!entry || typeof entry !== 'object') continue;
    for (const key of ['files', 'css', 'staticFiles']) {
      const list = entry[key];
      if (Array.isArray(list)) {
        for (const file of list) files.add(file);
      }
    }
  }
  return files;
}

function sumFiles(files) {
  let totalBytes = 0;
  for (const file of files) {
    const fullPath = join(nextDir, file);
    if (!existsSync(fullPath)) continue;
    totalBytes += statSync(fullPath).size;
  }
  return totalBytes;
}

function collectRouteSizes(manifest) {
  const routes = {};
  for (const [route, entry] of Object.entries(manifest)) {
    if (!entry || typeof entry !== 'object') continue;
    const files = new Set();
    for (const key of ['files', 'css', 'staticFiles']) {
      const list = entry[key];
      if (Array.isArray(list)) {
        for (const file of list) files.add(file);
      }
    }
    if (files.size === 0) continue;
    routes[route] = sumFiles(files);
  }
  return routes;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function compareWithBaseline(routes, baseline, thresholdKb) {
  const thresholdBytes = thresholdKb * 1024;
  const rows = [];
  let warned = false;

  const allRoutes = new Set([...Object.keys(routes), ...Object.keys(baseline)]);
  for (const route of [...allRoutes].sort()) {
    const current = routes[route] ?? 0;
    const base = baseline[route] ?? 0;
    const delta = current - base;
    const overThreshold = delta > thresholdBytes;
    if (overThreshold) warned = true;
    rows.push({ route, current, base, delta, overThreshold });
  }

  console.log('[bundle-budget] Route size comparison vs baseline:');
  console.log('| Route | Baseline | PR | Delta |');
  console.log('| --- | --- | --- | --- |');
  for (const row of rows) {
    const sign = row.delta > 0 ? '+' : '';
    const flag = row.overThreshold ? ' ⚠️' : '';
    console.log(
      `| ${row.route} | ${formatKb(row.base)} | ${formatKb(row.current)} | ${sign}${formatKb(row.delta)}${flag} |`,
    );
  }

  if (warned) {
    console.warn(
      `[bundle-budget] WARNING: one or more routes grew by more than ${thresholdKb} kB.`,
    );
  }
}

function main() {
  const budgetKb = parseBudget();
  const thresholdKb = parseThreshold();
  const jsonOut = parseArg('json');
  const baselinePath = parseArg('baseline');
  const manifestPath = join(nextDir, 'build-manifest.json');

  if (!existsSync(manifestPath)) {
    console.error(
      `[bundle-budget] Missing ${manifestPath}. Run \`next build\` before checking the bundle size.`,
    );
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const files = collectChunkFiles(manifest);
  const totalBytes = sumFiles(files);
  const routes = collectRouteSizes(manifest);

  if (jsonOut) {
    writeFileSync(
      jsonOut,
      JSON.stringify({ totalBytes, routes }, null, 2),
    );
    console.log(`[bundle-budget] Wrote report to ${jsonOut}.`);
  }

  if (baselinePath) {
    if (!existsSync(baselinePath)) {
      console.warn(`[bundle-budget] Baseline ${baselinePath} not found; skipping comparison.`);
    } else {
      const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
      compareWithBaseline(routes, baseline.routes ?? {}, thresholdKb);
    }
  }

  const totalKb = totalBytes / 1024;
  const budgetBytes = budgetKb * 1024;
  const formatted = `${totalKb.toFixed(1)} kB`;

  if (totalBytes > budgetBytes) {
    console.error(
      `[bundle-budget] FAIL: client bundle is ${formatted}, exceeding the ${budgetKb} kB budget.`,
    );
    process.exit(1);
  }

  console.log(
    `[bundle-budget] OK: client bundle is ${formatted} (budget ${budgetKb} kB).`,
  );
}

main();
