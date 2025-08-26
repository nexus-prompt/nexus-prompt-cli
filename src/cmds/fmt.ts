import fs from 'node:fs/promises';
import path from 'node:path';
import { formatSortKeysShallow, formatIndent2, formatLineWidth120 } from '../promptops/dsl/serializer.js';

// Markdown の YAML フロントマターのみ整形
const DEFAULT_EXTS = new Set(['.md']);

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

export async function runFmt(args: string[]) {
  // parse flags: --check to only check without writing
  let check = false;
  const targets: string[] = [];
  for (const a of args) {
    if (a === '--check' || a === '-c') check = true;
    else targets.push(a);
  }
  if (targets.length === 0) targets.push('.');

  const files = await collectFiles(targets);
  if (files.length === 0) {
    console.log('[nexus-prompt] No files to format.');
    return;
  }

  let changed = 0;
  let checked = 0;
  const needFormat: Array<{ file: string; reasons: string[] }> = [];

  for (const file of files) {
    try {
      const original = await fs.readFile(file, 'utf8');
      const eol = original.includes('\r\n') ? '\r\n' : '\n';

      // YAML front matter must be at the very start
      const fm = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;
      const m = original.match(fm);
      if (!m) {
        checked++;
        continue; // no front matter
      }

      const yamlText = m[1];
      if (yamlText.trim() === '') {
        checked++;
        continue; // empty front matter
      }

      // apply staged formatters to detect reasons
      let step1 = yamlText;
      let reasons: string[] = [];
      try {
        const afterSort = formatSortKeysShallow(step1);
        if (afterSort !== step1) {
          reasons.push('Sort keys (shallow): stable diffs');
        }
        step1 = afterSort;

        const afterIndent = formatIndent2(step1);
        if (afterIndent !== step1) {
          reasons.push('Indent = 2: consistent style');
        }
        step1 = afterIndent;

        const afterWidth = formatLineWidth120(step1);
        if (afterWidth !== step1) {
          reasons.push('lineWidth = 120: readability');
        }
        step1 = afterWidth;
      } catch (e) {
        console.warn(`[nexus-prompt][fmt] Invalid YAML front matter in ${file}: ${(e as Error).message}`);
        checked++;
        continue;
      }

      let newYaml = step1;

      if (!newYaml.endsWith('\n')) newYaml += '\n';
      const tail = m[2] || '';
      const replaced = `---${eol}${newYaml}---${tail}`;
      const rest = original.slice(m[0].length);
      const next = replaced + rest;

      checked++;
      if (next !== original) {
        if (check) {
          needFormat.push({ file, reasons });
        } else {
          await fs.writeFile(file, next, 'utf8');
          // print reasons for this update
          const why = reasons.length ? `: ${reasons.join(', ')}` : '';
          console.log(`[nexus-prompt][fmt] Updated ${file}${why}`);
        }
        changed++;
      }
    } catch (err) {
      console.warn(`[nexus-prompt][fmt] Skipped ${file}: ${(err as Error).message}`);
    }
  }

  if (check) {
    if (changed > 0) {
      console.error('[nexus-prompt] Formatting required for the following file(s):');
      for (const ent of needFormat) {
        const why = ent.reasons.length ? `  (${ent.reasons.join(', ')})` : '';
        console.error(`  - ${ent.file}${why}`);
      }
      console.error(`[nexus-prompt] ${changed} file(s) need formatting. Run: nexus-prompt fmt [paths]`);
      process.exitCode = 1;
    } else {
      console.log('[nexus-prompt] All files are properly formatted.');
    }
  } else {
    console.log(`[nexus-prompt] Formatted ${checked} file(s), updated ${changed}.`);
  }
}

async function collectFiles(targets: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const t of targets) {
    const abs = path.resolve(process.cwd(), t);
    await walk(abs, results);
  }
  return results;
}

async function walk(p: string, out: string[]) {
  try {
    const stat = await fs.stat(p);
    if (stat.isDirectory()) {
      const base = path.basename(p);
      if (SKIP_DIRS.has(base)) return;
      const items = await fs.readdir(p);
      for (const it of items) {
        await walk(path.join(p, it), out);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(p).toLowerCase();
      const base = path.basename(p);
      if (base.startsWith('framework-')) return;
      if (DEFAULT_EXTS.has(ext)) out.push(p);
    }
  } catch (e) {
    // ignore
  }
}
