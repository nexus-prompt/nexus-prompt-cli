import { defineConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

export default defineConfig({
  plugins: [
    {
      name: 'chmod-cli-executable',
      apply: 'build',
      closeBundle() {
        const out = path.resolve(__dirname, 'dist/cli.cjs');
        try {
          fs.chmodSync(out, 0o755);
        } catch {}
      },
    },
  ],
  build: {
    target: 'node18',
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/cli.ts'),
      name: 'nexus-prompt-cli',
      formats: ['cjs'],
      fileName: () => 'cli.cjs',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        banner: '#!/usr/bin/env node',
      },
      external: [
        // Externalize all Node builtins (avoid browser external shim)
        /^node:.*/,
        'node:path',
        'node:url',
        'node:fs',
        'node:fs/promises',
        'node:module',
        'path',
        'url',
        'fs',
        'module',
        // Keep runtime-resolved deps external so we can load user's local installs
        'prettier',
        'eslint',
      ],
    },
    minify: false,
    sourcemap: false,
  },
});
