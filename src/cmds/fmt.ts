import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const requireFromHere = createRequire(process.cwd() + '/');

const DEFAULT_EXTS = new Set([
  '.js',
  '.cjs',
  '.mjs',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.css',
  '.scss',
  '.less',
  '.md',
  '.mdx',
  '.html',
  '.yml',
  '.yaml',
]);

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

export async function runFmt(args: string[]) {
  const targets = args.length ? args : ['.'];

  let prettierMod: any;
  try {
    const resolved = requireFromHere.resolve('prettier');
    prettierMod = await import(pathToFileURL(resolved).href);
  } catch (e) {
    console.error(
      '[nexus-prompt] Prettier not found in this project. Please install it:\n  npm i -D prettier\n  pnpm add -D prettier\n  yarn add -D prettier'
    );
    process.exitCode = 1;
    return;
  }

  const prettier: any = prettierMod.default ?? prettierMod;

  const files = await collectFiles(targets);
  if (files.length === 0) {
    console.log('[nexus-prompt] No files to format.');
    return;
  }

  let changed = 0;
  let checked = 0;

  for (const file of files) {
    try {
      const original = await fs.readFile(file, 'utf8');
      const config = (await prettier.resolveConfig?.(file)) ?? {};
      const formatted = await prettier.format(original, { ...config, filepath: file });
      checked++;
      if (formatted !== original) {
        await fs.writeFile(file, formatted, 'utf8');
        changed++;
      }
    } catch (err) {
      // Ignore binary/unreadable files; just report and continue
      console.warn(`[nexus-prompt][fmt] Skipped ${file}: ${(err as Error).message}`);
    }
  }

  console.log(`[nexus-prompt] Formatted ${checked} file(s), updated ${changed}.`);
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
      if (DEFAULT_EXTS.has(ext)) out.push(p);
    }
  } catch (e) {
    // ignore
  }
}
