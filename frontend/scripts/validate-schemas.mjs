#!/usr/bin/env node
// Validates frontend domain schemas against the JSON schemas in schemas/events/.
// Fails (non-zero exit) when required properties are missing or property types
// mismatch between the frontend domain types and the JSON schemas.
//
// Follows the pattern of frontend/scripts/check-audit-waivers.mjs: plain Node,
// no dependencies, fast enough to run as part of the required CI gate.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const schemasDir = join(repoRoot, 'schemas', 'events');
const domainTypesPath = join(repoRoot, 'frontend', 'src', 'types', 'domain.ts');

// Maps each JSON schema file to the frontend domain interface it must match.
const SCHEMA_TO_INTERFACE = {
  'event.json': 'Event',
  'ticket.json': 'Ticket',
  'escrow.json': 'Escrow',
};

// JSON schema type -> acceptable TypeScript type keywords.
const TYPE_MAP = {
  string: ['string'],
  number: ['number'],
  integer: ['number'],
  boolean: ['boolean'],
  array: ['array', '[]'],
  object: ['object', 'Record'],
};

function fail(message) {
  console.error(`\u2717 ${message}`);
  process.exitCode = 1;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    fail(`Unable to parse ${path}: ${err.message}`);
    return null;
  }
}

// Extracts the body of an interface declaration from the domain types source.
function extractInterface(source, name) {
  const re = new RegExp(`interface\\s+${name}\\b[^{]*\\{([\\s\\S]*?)\\n\\}`);
  const match = source.match(re);
  return match ? match[1] : null;
}

// Parses `prop?: type;` lines into a map of property name -> type token.
function parseProperties(body) {
  const props = new Map();
  const lineRe = /^\s*([A-Za-z0-9_]+)(\?)?\s*:\s*([^;]+);/gm;
  let m;
  while ((m = lineRe.exec(body)) !== null) {
    props.set(m[1], { optional: Boolean(m[2]), type: m[3].trim() });
  }
  return props;
}

function typeMatches(tsType, jsonType) {
  const allowed = TYPE_MAP[jsonType];
  if (!allowed) return true; // unknown schema type: don't block
  return allowed.some((token) => tsType.includes(token));
}

function validateSchema(schemaFile, interfaceName, domainSource) {
  const schemaPath = join(schemasDir, schemaFile);
  if (!existsSync(schemaPath)) {
    fail(`Missing schema file: schemas/events/${schemaFile}`);
    return;
  }

  const schema = readJson(schemaPath);
  if (!schema) return;

  const body = extractInterface(domainSource, interfaceName);
  if (body === null) {
    fail(`Frontend interface ${interfaceName} not found in frontend/src/types/domain.ts`);
    return;
  }

  const props = parseProperties(body);
  const required = Array.isArray(schema.required) ? schema.required : [];
  const schemaProps = schema.properties || {};

  for (const key of required) {
    if (!props.has(key)) {
      fail(`${interfaceName} is missing required property "${key}" from schemas/events/${schemaFile}`);
    }
  }

  for (const [key, def] of Object.entries(schemaProps)) {
    const tsProp = props.get(key);
    if (!tsProp) continue; // optional schema props may be omitted
    if (def && def.type && !typeMatches(tsProp.type, def.type)) {
      fail(
        `${interfaceName}.${key} type mismatch: expected ${def.type} (schemas/events/${schemaFile}) but found "${tsProp.type}"`,
      );
    }
  }
}

function main() {
  if (!existsSync(schemasDir)) {
    fail('schemas/events/ directory not found');
    return;
  }
  if (!existsSync(domainTypesPath)) {
    fail('frontend/src/types/domain.ts not found');
    return;
  }

  const domainSource = readFileSync(domainTypesPath, 'utf8');
  const schemaFiles = readdirSync(schemasDir).filter((f) => f.endsWith('.json'));

  if (schemaFiles.length === 0) {
    fail('No JSON schemas found in schemas/events/');
    return;
  }

  for (const file of schemaFiles) {
    const interfaceName = SCHEMA_TO_INTERFACE[file];
    if (!interfaceName) {
      console.warn(`\u26a0 No frontend interface mapping for schemas/events/${file}, skipping`);
      continue;
    }
    validateSchema(file, interfaceName, domainSource);
  }

  if (process.exitCode) {
    console.error('\nSchema validation failed.');
  } else {
    console.log('\u2713 Frontend domain schemas match schemas/events/');
  }
}

main();
