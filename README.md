# nexus-prompt CLI

TypeScript と Vite で構築された、フォーマット（fmt）とリント（lint）のヘルパーを提供する CLI です。

## インストール

- ローカル（推奨）:
  - npm: `npm i -D nexus-prompt-cli`
  - pnpm: `pnpm add -D nexus-prompt-cli`
  - yarn: `yarn add -D nexus-prompt-cli`

これにより `nexus-prompt` コマンドが利用可能になります。

## 使い方

- Markdown の YAML フロントマターのみ整形（dumpYamlStable）:
  - `npx nexus-prompt fmt [--check] [paths...]`
  - 例:
    - `npx nexus-prompt fmt .`
    - `npx nexus-prompt fmt --check .`（CI向け: 変更が必要なら非0終了）
    - `npx nexus-prompt fmt src tests`

- ESLint でリント:
  - `npx nexus-prompt lint [--fix] [patterns...]`
  - 例:
    - `npx nexus-prompt lint .`
    - `npx nexus-prompt lint --fix "src/**/*.{ts,tsx}"`

## 動作概要

- `fmt` は `.md` を走査し、先頭の YAML フロントマターのみを `dumpYamlStable` で安定整形します（本文は変更しません）。
  - `--check` を付けると書き込みせず差分の有無だけを判定し、必要があれば非0終了します（CI向け）。
- `lint` はプロジェクトから ESLint を動的に読み込み、ローカル設定で実行します。`--fix` で自動修正に対応。ESLint が未インストールの場合は、インストール方法を案内します。

## ビルド

- Vite（Rollup）でビルドし、`dist/cli.cjs` にシバン付きの Node 向け CJS バイナリを出力します。
- スクリプト:
  - `npm run build`

## 注意事項

- `lint` を利用するには `eslint` をプロジェクトにインストールしてください。
- `fmt` は `node_modules`、`.git`、`dist`、`build`、`coverage` をスキップします。

## ローカルインストール（macOS）

### クイックオプション

- npm link（開発に最適）: グローバルへシンボリックリンクして即時動作を確認。
- npm pack + install: tarball を作成し、グローバルまたはプロジェクトにインストール。
- ローカルパスからインストール: フォルダを直接指定してインストール。

### 事前準備

- まずビルド: `npm run build`（`dist/cli.cjs` を生成）。
- PATH: グローバル npm の bin（例: `$(npm bin -g)` または `$(npm prefix -g)/bin`）がシェルの `PATH` に通っていることを確認してください。

### オプション1 — npm link（グローバルシンボリックリンク）

- プロジェクトルートで: `npm link`
- 確認: `nexus-prompt --help`
- 解除: `npm unlink -g nexus-prompt-cli`

### オプション2 — tarball を作成してインストール

- ビルド: `npm run build`（`prepack` でも実行されます）。
- tarball 作成: `npm pack` → `nexus-prompt-cli-<version>.tgz` が生成されます。
- グローバルにインストール: `npm i -g ./nexus-prompt-cli-<version>.tgz`
- 利用: `nexus-prompt --help`

### オプション3 — ローカルフォルダからインストール

- グローバルにインストール: `npm i -g /absolute/path/to/nexus-prompt-cli`
  - インストール時に `prepare` が走り、ビルドされます。
- または特定のプロジェクトへインストール:
  - 対象プロジェクトで: `npm i -D /absolute/path/to/nexus-prompt-cli`
  - 実行: `npx nexus-prompt fmt .`

### 備考

- package.json の `bin` は `nexus-prompt` → `dist/cli.cjs` をマッピングし、インストール時に実行権限が付与されます。
- `prepack` は毎回ビルドを実行するため、`npm pack` で常に最新の `dist` が含まれます。
