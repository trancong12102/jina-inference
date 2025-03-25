import { z } from 'zod';

const defaultResponseSchema = z
  .object({
    statusCode: z.number(),
    code: z.string(),
    error: z.string(),
    message: z.string(),
  })
  .openapi({
    ref: 'Error',
  });

export const responseWithDefaultSchema = <T>(schema: T) => ({
  ...schema,
  default: defaultResponseSchema,
});
