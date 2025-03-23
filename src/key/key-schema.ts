import camelcaseKeys from 'camelcase-keys';
import { createSelectSchema } from 'drizzle-zod';
import type { CamelCasedPropertiesDeep } from 'type-fest';
import { z } from 'zod';
import { keys } from '../lib/db';
// Schemas from jina
export const userWalletResponseSchema = z.object({
  user_id: z.string().uuid().optional(),
  trial_balance: z.number().optional(),
  trial_start: z.coerce.date().optional(),
  trial_end: z.coerce.date().optional(),
  regular_balance: z.number().optional(),
  total_balance: z.number(),
  metadata: z.record(z.any()).optional(),
});

export const userMetadataResponseSchema = z.object({
  speed_level: z.number().optional(),
  last_purchased_price_id: z.string().nullable().optional(),
  last_purchased_product_name: z.string().nullable().optional(),
});

export const userResponseSchema = z.object({
  user_id: z.string().uuid().optional(),
  email: z.string().nullable().optional(),
  full_name: z.string().optional(),
  customer_id: z.string().nullable().optional(),
  avatar_url: z.string().optional(),
  billing_address: z.record(z.any()).optional(),
  payment_method: z.record(z.any()).optional(),
  wallet: userWalletResponseSchema,
  metadata: userMetadataResponseSchema.optional(),
});
export type UserResponse = z.infer<typeof userResponseSchema>;

// Domain schema for user
export type User = CamelCasedPropertiesDeep<UserResponse>;
export const mapUserResponseToUser = (user: UserResponse): User =>
  camelcaseKeys(user, { deep: true });

export const keySchema = createSelectSchema(keys);
export type Key = typeof keys.$inferSelect;

export const keyStatusSchema = z.object({
  totalBalance: z.bigint(),
  totalKeys: z.number(),
  totalAvailableKeys: z.number(),
  totalAvailableBalance: z.bigint(),
});
export type KeyStatus = z.infer<typeof keyStatusSchema>;

export const createKeyInputSchema = z.object({
  key: z.string(),
});
export type CreateKeyInput = z.infer<typeof createKeyInputSchema>;
