import fs from 'node:fs/promises';
import path from 'node:path';
import { parsePrompt } from '../promptops/dsl/prompt/registry';
import {
  validateTemplateInputsConsistencyFromDsl,
  hasRemainingPlaceholders,
} from '../promptops/dsl/prompt/linter';
import { parseFrontMatter } from '../promptops/dsl/parser';

// Markdown の YAML フロントマターを lint 対象にする
const DEFAULT_EXTS = new Set(['.md']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

export async function runLint(args: string[]) {
  // fmt.ts と同様: パス（デフォルト '.'）を受け取り、配下の対象ファイルを全て検査
  const targets: string[] = [];
  for (const a of args) targets.push(a);
  if (targets.length === 0) targets.push('.');

  const files = await collectFiles(targets);
  if (files.length === 0) {
    console.log('[nexus-prompt] No files to lint.');
    return;
  }

  let checked = 0;
  let errorCount = 0;
  let warnCount = 0;

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');

      // YAML front matter は先頭にある必要がある
      const fm = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;
      const m = content.match(fm);
      if (!m) {
        // front matter が無ければ対象外（fmt と同様の基準に合わせる）
        checked++;
        continue;
      }

      const yamlText = m[1];
      if (yamlText.trim() === '') {
        // 空 front matter はスキップ
        checked++;
        continue;
      }

      const parsed = parseFrontMatter(content);
      if (!parsed) {
        // parse失敗 はスキップ
        checked++;
        continue;
      }

      // Prompt DSL をパース（v1 互換で v2 に昇格）
      let prompt;
      try {
        const rawContent = { ...parsed.data, template: parsed.body };
        prompt = parsePrompt(rawContent);
      } catch (e) {
        const msg = (e as Error)?.message ?? String(e);
        console.error(`[nexus-prompt][lint] Invalid front matter in ${file}: ${msg}`);
        errorCount++;
        checked++;
        continue;
      }

      // template と inputs の整合性チェック
      const res = validateTemplateInputsConsistencyFromDsl(prompt);
      if (res.missingInInputs.length > 0) {
        console.error(
          `[nexus-prompt][lint] ${file}: Variables used in template but missing in inputs: ${res.missingInInputs.join(
            ', '
          )}`
        );
        errorCount++;
      }
      if (res.missingInTemplate.length > 0) {
        console.error(
          `[nexus-prompt][lint] ${file}: Input(s) not referenced in template: ${res.missingInTemplate.join(', ')}`
        );
        warnCount++;
      }

      // 本文やその他に残る未展開プレースホルダーの簡易チェック（参考/警告）
      if (typeof prompt.template === 'string' && hasRemainingPlaceholders(prompt.template)) {
        // template 内に {{var}} が存在することは通常仕様だが、inputs に存在しない場合は上記で検出済み。
        // ここでは冗長な警告は出さない。
      }

      checked++;
    } catch (err) {
      console.warn(`[nexus-prompt][lint] Skipped ${file}: ${(err as Error).message}`);
    }
  }

  console.log(
    `[nexus-prompt] Lint complete. ${errorCount} error(s), ${warnCount} warning(s), checked ${checked} file(s).`
  );
  if (errorCount > 0) process.exitCode = 1;
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

