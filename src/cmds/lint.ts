import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const requireFromHere = createRequire(process.cwd() + '/');

export async function runLint(args: string[]) {
  // Very small arg parser
  const patterns: string[] = [];
  let fix = false;
  for (const a of args) {
    if (a === '--fix') fix = true;
    else patterns.push(a);
  }

  if (patterns.length === 0) patterns.push('.');

  let eslintMod: any;
  try {
    const resolved = requireFromHere.resolve('eslint');
    eslintMod = await import(pathToFileURL(resolved).href);
  } catch (e) {
    console.error(
      '[nexus-prompt] ESLint not found in this project. Please install it:\n  npm i -D eslint\n  pnpm add -D eslint\n  yarn add -D eslint'
    );
    process.exitCode = 1;
    return;
  }

  const ESLintCtor = eslintMod.ESLint ?? eslintMod.default?.ESLint;
  if (!ESLintCtor) {
    console.error('[nexus-prompt] Could not load ESLint API.');
    process.exitCode = 1;
    return;
  }

  const eslint = new ESLintCtor({ cwd: process.cwd(), fix });
  const results = await eslint.lintFiles(patterns);
  if (fix) await ESLintCtor.outputFixes(results);

  const formatter = await eslint.loadFormatter('stylish');
  const output = formatter.format(results);
  if (output) process.stdout.write(output);

  const errorCount = results.reduce((n: number, r: any) => n + (r.errorCount || 0), 0);
  const warnCount = results.reduce((n: number, r: any) => n + (r.warningCount || 0), 0);
  console.log(`[nexus-prompt] Lint complete. ${errorCount} error(s), ${warnCount} warning(s).`);
  if (errorCount > 0) process.exitCode = 1;
}
