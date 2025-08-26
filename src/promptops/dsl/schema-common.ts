import { z } from 'zod';

export const Slug = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/);
export const UuidV1toV6 = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-6][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  'Invalid UUID (v1–v6 expected)'
);
