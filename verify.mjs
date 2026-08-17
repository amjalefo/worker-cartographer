#!/usr/bin/env node
// verify.mjs — checks a produced map against the rules in this folder.
// No network, no API key, no dependencies. Node 18+.
//
//   node verify.mjs <map-dir> [--subject <dir>]   check a map
//   node verify.mjs --selftest                    prove the checker fails when it should
//
// The governing rule, and it cuts against the checker itself:
// A CHECK MAY NOT FLAG WHAT IT CANNOT QUOTE. Where evidence is unreachable —
// the subject tree is private, a file is absent — it reports UNVERIFIABLE and
// says why. It never converts "I could not look" into "this is wrong".

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SECTIONS = [
  'One sentence', 'Why this shape', 'Shape', 'Connected to',
  'If you change this', 'Surfaces', 'See',
];
const NOUNS = ['entry', 'binding', 'route', 'table', 'config-record', 'secret'];
const MOVEMENTS = ['verify', 'resolve', 'gate', 'render', 'persist', 'schedule'];
const UNIVERSES = ['live', 'leftover', 'ghost', 'inert'];

const F = { pass: 0, fail: 0, unverifiable: 0 };
const results = [];

function record(status, check, where, detail) {
  results.push({ status, check, where, detail });
  F[status === 'PASS' ? 'pass' : status === 'FAIL' ? 'fail' : 'unverifiable']++;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

// A card is a .md file whose body carries the header line.
const HEADER = /^\s*type:\s*(object|process)\s*·\s*card:\s*([a-z-]+)\s*·\s*universe:\s*([a-z]+)\s*(?:·\s*status:\s*(\w+))?/m;

function checkHeader(file, text, rel) {
  const m = text.match(HEADER);
  if (!m) return null;
  const [, type, card, universe, status] = m;

  const valid = type === 'object' ? NOUNS : MOVEMENTS;
  if (!valid.includes(card)) {
    record('FAIL', 'closed-card-set', rel,
      `card type "${card}" is not in the closed set for ${type} (${valid.join(', ')})`);
  } else record('PASS', 'closed-card-set', rel, `${type}/${card}`);

  if (!UNIVERSES.includes(universe)) {
    record('FAIL', 'universe', rel, `universe "${universe}" is not one of ${UNIVERSES.join(', ')}`);
  } else record('PASS', 'universe', rel, universe);

  // verified requires BOTH a date and a commit — a date alone does not pin the tree.
  const verified = text.match(/status:\s*verified\s+([\d-]+)(\s*@\s*([0-9a-f]{7,40}))?/);
  if (verified && !verified[3]) {
    record('FAIL', 'verified-needs-commit', rel,
      `status "verified ${verified[1]}" has no commit. A path:line map goes stale on the next edit; a date alone does not pin the tree.`);
  } else if (verified) record('PASS', 'verified-needs-commit', rel, `@${verified[3]}`);

  return { type, card, universe, status };
}

function checkSections(text, rel) {
  const missing = SECTIONS.filter((s) => !new RegExp(`\\*\\*${s}`, 'i').test(text));
  if (missing.length) {
    record('FAIL', 'seven-sections', rel, `missing: ${missing.join(', ')}`);
  } else record('PASS', 'seven-sections', rel, 'all seven present');
}

function checkWaterfall(text, rel) {
  const hits = /\*\*Hits[:.]?\*\*\s*([^\n]*)/i.exec(text);
  const not = /\*\*Does not hit[:.]?\*\*\s*([^\n]*)/i.exec(text);
  if (!not) {
    record('FAIL', 'does-not-hit', rel, 'no "Does not hit" — the half that earns the map');
  } else if (not[1].replace(/[\s—–-]/g, '').length < 12) {
    record('FAIL', 'does-not-hit', rel, `"Does not hit" is empty or a dash. Name the obvious wrong neighbour and why it is wrong.`);
  } else record('PASS', 'does-not-hit', rel, 'named');
  if (!hits) record('FAIL', 'hits', rel, 'no "Hits"');
  else record('PASS', 'hits', rel, 'present');
}

// A ghost card must carry the grep that proves it. A comment is not evidence.
function checkGhostEvidence(text, rel, universe) {
  if (universe !== 'ghost') return;
  const hasGrep = /grep\s+-[a-zA-Z]*n?[a-zA-Z]*\s/.test(text);
  const hasOutput = /→|->|returns|no output|zero hits|one hit/i.test(text);
  if (hasGrep && hasOutput) record('PASS', 'ghost-evidence', rel, 'grep + result present');
  else record('FAIL', 'ghost-evidence', rel,
    'ghost without its grep. A comment claiming "nothing writes this" is how a map starts lying — put the command and its output in the card.');
}

// Every `path:line` must resolve in the subject tree. Without the tree: UNVERIFIABLE.
const CITE = /`([\w./-]+\.(?:js|mjs|ts|tsx|jsx|sql|toml|jsonc?|vue|py|sh))(?::(\d+)(?:-(\d+))?)?`/g;

// Cards cite the way a developer talks: `inboxes.js:241` for a file that lives at
// src/server/inboxes.js. That is a relative citation, not a false one — resolve it
// by basename when exactly one file in the tree answers to that name. Two matches
// is genuinely ambiguous and gets flagged; zero is a real miss.
function resolveCite(subject, path, index) {
  const direct = join(subject, path);
  if (existsSync(direct)) return { full: direct, exact: true };
  const base = path.split('/').pop();
  const hits = index.get(base);
  if (!hits || !hits.length) return { miss: true };
  if (hits.length > 1) return { ambiguous: hits };
  return { full: hits[0], exact: false };
}

function indexTree(subject) {
  const index = new Map();
  const skip = /node_modules|\.git|dist|build|\.wrangler/;
  (function rec(dir) {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const name of entries) {
      const p = join(dir, name);
      if (skip.test(p)) continue;
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) rec(p);
      else {
        if (!index.has(name)) index.set(name, []);
        index.get(name).push(p);
      }
    }
  })(subject);
  return index;
}

function checkCitations(text, rel, subject, index) {
  const cites = [...text.matchAll(CITE)];
  if (!cites.length) return;
  if (!subject) {
    record('UNVERIFIABLE', 'citations', rel,
      `${cites.length} citation(s) present; no --subject given, so none were re-read. Not a failure: unreachable evidence is not a wrong claim.`);
    return;
  }
  let exact = 0, resolved = 0;
  const misses = [], overLine = [], ambiguous = [];
  for (const [, path, line] of cites) {
    const r = resolveCite(subject, path, index);
    if (r.miss) { misses.push(path); continue; }
    if (r.ambiguous) { ambiguous.push(`${path} (${r.ambiguous.length} files share that name)`); continue; }
    if (line) {
      const count = readFileSync(r.full, 'utf8').split('\n').length;
      if (Number(line) > count) { overLine.push(`${path}:${line} — file has ${count} lines`); continue; }
    }
    r.exact ? exact++ : resolved++;
  }
  const uniq = (a) => [...new Set(a)];
  if (misses.length) record('FAIL', 'citations', rel, `not in the subject tree: ${uniq(misses).join(', ')}`);
  if (overLine.length) record('FAIL', 'citations', rel, `line past end of file: ${uniq(overLine).join(' · ')}`);
  if (ambiguous.length) record('FAIL', 'citations', rel, `ambiguous basename, cite the full path: ${uniq(ambiguous).join(' · ')}`);
  if (exact + resolved) record('PASS', 'citations', rel,
    `${exact + resolved} re-read (${exact} exact, ${resolved} resolved by basename)`);
}

function checkCatalog(files, dir) {
  const cat = files.find((f) => /(^|\/)(\d+-)?(catalog|CLAUDE|CONTEXT)\.md$/i.test(f));
  if (!cat) {
    record('FAIL', 'catalog-exists', relative(dir, dir) || '.', 'no catalog file — the map has no front door');
    return;
  }
  const text = readFileSync(cat, 'utf8');
  const rel = relative(dir, cat);
  if (/collision|collid|looks-like|also means/i.test(text)) record('PASS', 'catalog-collisions', rel, 'collisions named');
  else record('FAIL', 'catalog-collisions', rel, 'catalog names no collisions. Three sources collide in every Worker; silence here means they were not checked.');
}

function run(dir, subject) {
  const files = walk(dir);
  if (!files.length) { record('FAIL', 'map-exists', dir, 'no .md files'); return; }
  const index = subject ? indexTree(subject) : null;
  checkCatalog(files, dir);
  let cards = 0;
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const rel = relative(dir, file);
    const header = checkHeader(file, text, rel);
    if (!header) { checkCitations(text, rel, subject, index); continue; }
    cards++;
    if (header.status === 'stub') continue;
    checkSections(text, rel);
    checkWaterfall(text, rel);
    checkGhostEvidence(text, rel, header.universe);
    checkCitations(text, rel, subject, index);
  }
  if (!cards) record('FAIL', 'cards-exist', '.', 'no card carries a header line');
  else record('PASS', 'cards-exist', '.', `${cards} card(s)`);
}

// --- selftest: six broken maps, each must fail on its OWN named check ---------
const FIXTURES = [
  { name: 'missing-does-not-hit', expect: 'does-not-hit',
    card: `type: object · card: table · universe: live · status: stale 2026-01-01\n**One sentence.** x\n**Why this shape.** x\n**Shape.** x\n**Connected to.** x\n**If you change this.**\n- **Hits:** something real here\n- **Does not hit:** —\n**Surfaces.** x\n**See.** x` },
  { name: 'ghost-without-grep', expect: 'ghost-evidence',
    card: `type: object · card: binding · universe: ghost · status: stale 2026-01-01\n**One sentence.** x\n**Why this shape.** the comment says nothing writes it\n**Shape.** x\n**Connected to.** x\n**If you change this.**\n- **Hits:** nothing today\n- **Does not hit:** the other binding, which is live and load-bearing\n**Surfaces.** x\n**See.** x` },
  { name: 'invalid-card-type', expect: 'closed-card-set',
    card: `type: object · card: middleware · universe: live · status: stale 2026-01-01\n**One sentence.** x\n**Why this shape.** x\n**Shape.** x\n**Connected to.** x\n**If you change this.**\n- **Hits:** x\n- **Does not hit:** the neighbour that is not touched here\n**Surfaces.** x\n**See.** x` },
  { name: 'missing-sections', expect: 'seven-sections',
    card: `type: process · card: gate · universe: live · status: stale 2026-01-01\n**One sentence.** x\n**If you change this.**\n- **Hits:** x\n- **Does not hit:** the neighbour that is not touched here` },
  { name: 'verified-without-commit', expect: 'verified-needs-commit',
    card: `type: object · card: table · universe: live · status: verified 2026-08-16\n**One sentence.** x\n**Why this shape.** x\n**Shape.** x\n**Connected to.** x\n**If you change this.**\n- **Hits:** x\n- **Does not hit:** the neighbour that is not touched here\n**Surfaces.** x\n**See.** x` },
  { name: 'broken-citation', expect: 'citations', needsSubject: true,
    card: `type: object · card: entry · universe: live · status: stale 2026-01-01\n**One sentence.** x\n**Why this shape.** x\n**Shape.** see \`worker.js:99999\`\n**Connected to.** x\n**If you change this.**\n- **Hits:** x\n- **Does not hit:** the neighbour that is not touched here\n**Surfaces.** x\n**See.** x` },
  { name: 'invalid-universe', expect: 'universe',
    card: `type: object · card: table · universe: probably · status: stale 2026-01-01\n**One sentence.** x\n**Why this shape.** x\n**Shape.** x\n**Connected to.** x\n**If you change this.**\n- **Hits:** x\n- **Does not hit:** the neighbour that is not touched here\n**Surfaces.** x\n**See.** x` },
  { name: 'missing-hits', expect: 'hits',
    card: `type: object · card: table · universe: live · status: stale 2026-01-01\n**One sentence.** x\n**Why this shape.** x\n**Shape.** x\n**Connected to.** x\n**If you change this.**\n- **Does not hit:** the neighbour that is not touched here\n**Surfaces.** x\n**See.** x` },
  { name: 'catalog-without-collisions', expect: 'catalog-collisions', catalog: '# catalog\nnouns and movements, but nobody checked the names\n',
    card: `type: object · card: table · universe: live · status: stale 2026-01-01\n**One sentence.** x\n**Why this shape.** x\n**Shape.** x\n**Connected to.** x\n**If you change this.**\n- **Hits:** x\n- **Does not hit:** the neighbour that is not touched here\n**Surfaces.** x\n**See.** x` },
  { name: 'no-cards-only-prose', expect: 'cards-exist',
    card: `# notes\nThis file describes the Worker in prose and carries no card header at all.\n` },
];

// Every check this file can emit as a FAIL must have a fixture that provokes it.
// Without this assertion a check can rot silently: it stops firing, every map
// passes, and nothing says so. Alex Brown's coverage assertion, Comp #9.
const EMITTABLE = [
  'closed-card-set', 'universe', 'verified-needs-commit', 'seven-sections',
  'does-not-hit', 'hits', 'ghost-evidence', 'citations',
  'catalog-exists', 'catalog-collisions', 'cards-exist', 'map-exists',
];
// Declared as unreachable-by-fixture, with the reason. Shrinking this list is the work.
const UNCOVERED = {
  'catalog-exists': 'a map dir with no catalog file at all — degenerate, and catalog-collisions covers the live path',
  'map-exists': 'an empty directory — degenerate',
};

function selftest() {
  const { mkdtempSync, writeFileSync, mkdirSync } = require_fs();
  const { tmpdir } = require_os();
  let allOk = true;
  console.log('SELFTEST — each fixture must fail on its own named check\n');
  for (const fx of FIXTURES) {
    const dir = mkdtempSync(join(tmpdir(), 'wc-'));
    writeFileSync(join(dir, 'catalog.md'), fx.catalog ?? '# catalog\nnames that collide: also means\n');
    writeFileSync(join(dir, 'card.md'), fx.card);
    let subject = null;
    if (fx.needsSubject) {
      subject = mkdtempSync(join(tmpdir(), 'wc-subj-'));
      writeFileSync(join(subject, 'worker.js'), 'a\nb\nc\n');
    }
    results.length = 0; F.pass = F.fail = F.unverifiable = 0;
    run(dir, subject);
    const failed = results.filter((r) => r.status === 'FAIL').map((r) => r.check);
    const hit = failed.includes(fx.expect);
    // A fixture that fails on the WRONG check is not a pass — that is the trap.
    const clean = hit && failed.every((c) => c === fx.expect);
    console.log(`  ${clean ? 'OK  ' : 'MISS'}  ${fx.name.padEnd(24)} expected FAIL on "${fx.expect}"` +
      (clean ? '' : `  ← got: [${failed.join(', ') || 'nothing'}]`));
    if (!clean) allOk = false;
  }
  // Coverage: no check may exist without a fixture that provokes it.
  const covered = new Set(FIXTURES.map((f) => f.expect));
  const gaps = EMITTABLE.filter((c) => !covered.has(c) && !(c in UNCOVERED));
  console.log(`\n  coverage  ${covered.size + Object.keys(UNCOVERED).length}/${EMITTABLE.length} checks accounted for`);
  for (const [check, why] of Object.entries(UNCOVERED)) console.log(`            (no fixture) ${check} — ${why}`);
  if (gaps.length) {
    console.log(`\n  GAP  these checks can fail a real map and no fixture proves they still fire: ${gaps.join(', ')}`);
    allOk = false;
  }

  console.log(`\n${allOk ? 'PASS' : 'FAIL'} — ${FIXTURES.length} fixtures\n`);
  console.log('The trap: a fixture that fails on the wrong check counts as a MISS.');
  console.log('A checker that fails everything is not a checker, and a check nobody');
  console.log('provokes can rot silently — which is what the coverage line is for.\n');
  process.exit(allOk ? 0 : 1);
}

function require_fs() { return { mkdtempSync: fsx.mkdtempSync, writeFileSync: fsx.writeFileSync, mkdirSync: fsx.mkdirSync }; }
function require_os() { return { tmpdir: osx.tmpdir }; }
import * as fsx from 'node:fs';
import * as osx from 'node:os';

// --- main --------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.includes('--selftest')) selftest();

const dir = args.find((a) => !a.startsWith('--'));
if (!dir) {
  console.error('usage: node verify.mjs <map-dir> [--subject <dir>]  |  node verify.mjs --selftest');
  process.exit(2);
}
const si = args.indexOf('--subject');
const subject = si >= 0 ? resolve(args[si + 1]) : null;

run(resolve(dir), subject);

const order = { FAIL: 0, UNVERIFIABLE: 1, PASS: 2 };
results.sort((a, b) => order[a.status] - order[b.status]);
for (const r of results) {
  if (r.status === 'PASS') continue;
  console.log(`${r.status.padEnd(13)} ${r.check.padEnd(22)} ${r.where}\n              ${r.detail}`);
}
console.log(`\n${F.fail} fail · ${F.unverifiable} unverifiable · ${F.pass} pass`);
if (!subject) console.log('(no --subject: citations were not re-read. Unreachable evidence is reported, never guessed.)');
process.exit(F.fail ? 1 : 0);
