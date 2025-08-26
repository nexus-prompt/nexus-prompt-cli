import { z } from 'zod';
import { Slug, UuidV1toV6 } from '../schema-common';

export interface PromptSchema {
  version: number;
}
export const EnumGroups = z.record(z.array(z.string()));
export const Labels = z.record(z.record(z.string()));
export const Test = z.object({
  name: z.string().min(1),
  with: z.record(z.unknown()).default({}),
  assert: z.object({
    contains: z.array(z.string()).optional(),
    notContains: z.array(z.string()).optional(),
    maxTokens: z.number().int().positive().optional(),
  }).default({}),
}).strict();
export { Slug, UuidV1toV6 };

// 共通のModel/Inputスキーマ（v1/v2で重複していた定義を集約）
export const PromptModelSchema = z.object({
  provider: z.string().min(1),
  name: z.string().min(1),
  params: z.record(z.unknown()).optional(),
}).strict();

export const PromptInputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  required: z.boolean().optional().default(false),
  ref: z.string().optional(), // enumグループ名等に参照する場合
  description: z.string().optional(),
  default: z.unknown().optional(),
}).strict();
