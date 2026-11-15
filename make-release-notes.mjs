#!/usr/bin/env node
// make-release-notes.mjs — turn a Wolffie module's manifest.json into RELEASENOTES.md
//
//   node make-release-notes.mjs [path/to/manifest.json] [path/to/RELEASENOTES.md]
//
// Defaults: ./manifest.json -> ./RELEASENOTES.md
// Lines in a version's "changes" that start with "PENDING:" are listed under
// "Known issues" for that version instead of as finished changes.

import { readFileSync, writeFileSync } from 'node:fs';

const [, , inPath = 'manifest.json', outPath = 'RELEASENOTES.md'] = process.argv;
const m = JSON.parse(readFileSync(inPath, 'utf8'));

if (!m.id || !m.version) throw new Error(`${inPath}: "id" and "version" are required`);
const log = Array.isArray(m.changelog) ? m.changelog : [];
if (log.length && log[0].version !== m.version) {
  console.warn(`WARNING: manifest version is ${m.version}, but the newest changelog entry is ${log[0].version}`);
}

const out = [];
out.push(`# ${m.name || m.id}: release notes`, '');
if (m.description) out.push(m.description, '');

const facts = [`**Current version:** ${m.version}`, `**Module id:** \`${m.id}\``];
if (m.dependencies && Object.keys(m.dependencies).length) {
  facts.push('**Requires:** ' + Object.entries(m.dependencies).map(([k, v]) => `${k} ${v}`).join(', '));
}
if (Array.isArray(m.services) && m.services.length) {
  facts.push('**Provides:** ' + m.services.map(s => `\`${s.type}\``).join(', '));
}
out.push(facts.join('  \n'), '');

for (const entry of log) {
  const changes = entry.changes || [];
  const done = changes.filter(c => !/^PENDING:/i.test(c));
  const pending = changes.filter(c => /^PENDING:/i.test(c)).map(c => c.replace(/^PENDING:\s*/i, ''));

  out.push(`## ${entry.version}${entry.date ? ` (${entry.date})` : ''}`, '');
  for (const c of done) out.push(`- ${c}`);
  if (pending.length) {
    out.push('', '**Known issues in this version**', '');
    for (const c of pending) out.push(`- ${c}`);
  }
  out.push('');
}

writeFileSync(outPath, out.join('\n').replace(/\n+$/, '\n'));
console.log(`Wrote ${outPath}: ${log.length} versions, newest ${log[0]?.version ?? '(none)'}`);
