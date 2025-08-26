import { runFmt } from './cmds/fmt.js';
import { runLint } from './cmds/lint.js';

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = argv.slice(1);

  switch (cmd) {
    case 'fmt':
      await runFmt(args);
      return;
    case 'lint':
      await runLint(args);
      return;
    case '--help':
    case '-h':
    default: {
      printHelp();
      if (!cmd || cmd === '--help' || cmd === '-h') return;
      process.exitCode = 1;
    }
  }
}

function printHelp() {
  const lines = [
    'nexus-prompt <command> [options]',
    '',
    'Commands:',
    '  fmt   Format Markdown front matter (YAML)',
    '        Usage: nexus-prompt fmt [--check] [paths...]  # defaults to .',
    '  lint  Lint files using local ESLint',
    '        Usage: nexus-prompt lint [--fix] [patterns...]',
    '',
    'Examples:',
    '  npx nexus-prompt fmt .',
    '  npx nexus-prompt lint --fix "src/**/*.{ts,tsx}"',
  ];
  console.log(lines.join('\n'));
}

main().catch((err) => {
  console.error('[nexus-prompt] Fatal error:', err?.stack || err);
  process.exit(1);
});
