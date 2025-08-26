import yaml from 'js-yaml';

// 共通シリアライザ: YAML load/dump + 差分安定のための正規化

export function loadYaml(text: string): unknown {
  return yaml.load(text);
}

// キー順を安定化させる（浅いレベルのソート）。必要なら深い正規化を拡張
export function sortKeysShallow(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const entries = Object.entries(obj as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  const out: Record<string, unknown> = {};
  for (const [k, v] of entries) out[k] = v;
  return out;
}

// 1) フォーマッター: 浅いキー順ソート（テキスト→テキスト）
export function formatSortKeysShallow(yamlText: string): string {
  const obj = loadYaml(yamlText);
  const normalized = sortKeysShallow(obj);
  // 他のフォーマッタに委ねるため、ここではデフォルト設定でdump
  return yaml.dump(normalized);
}

// 2) フォーマッター: インデント幅を2に固定（テキスト→テキスト）
export function formatIndent2(yamlText: string): string {
  const obj = loadYaml(yamlText);
  return yaml.dump(obj, { indent: 2 });
}

// 3) フォーマッター: 行幅を120に固定（テキスト→テキスト）
export function formatLineWidth120(yamlText: string): string {
  const obj = loadYaml(yamlText);
  return yaml.dump(obj, { lineWidth: 120 });
}

// まとめ: 既存の安定ダンプ（後方互換）
export function dumpYamlStable(obj: unknown): string {
  const normalized = sortKeysShallow(obj);
  return yaml.dump(normalized, { indent: 2, lineWidth: 120 });
}
