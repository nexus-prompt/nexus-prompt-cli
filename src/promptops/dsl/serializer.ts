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

export function dumpYamlStable(obj: unknown): string {
  const normalized = sortKeysShallow(obj);
  return yaml.dump(normalized, { indent: 2, lineWidth: 120 });
}
