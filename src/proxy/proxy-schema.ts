import { z } from 'zod';

export const embedInputSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.enum(['jina-clip-v2']),
  // Ignore dimensions if not provided
  dimensions: z.number().int().positive().max(1024).default(1024).optional(),
});
export type EmbedInput = z.infer<typeof embedInputSchema>;

export const jinaUsageResponseSchema = z.object({
  usage: z.object({
    total_tokens: z.number().int().positive(),
  }),
});
export type JinaUsageResponse = z.infer<typeof jinaUsageResponseSchema>;

export const embedResponseSchema = z
  .object({
    model: z.string(),
    object: z.enum(['list']),
    data: z.array(
      z.object({
        index: z.number().int(),
        embedding: z.array(z.number()),
        object: z.enum(['embedding']),
      }),
    ),
  })
  .and(jinaUsageResponseSchema);
export type EmbedResponse = z.infer<typeof embedResponseSchema>;

export type JinaEmbedChunkInput =
  | {
      text: string;
    }
  | {
      image: string;
    };

export type JinaEmbedInput = Omit<EmbedInput, 'input'> & {
  input: JinaEmbedChunkInput[];
};

export const mapOpenAIEmbedInputToJinaInput = (
  source: EmbedInput,
): JinaEmbedInput => {
  const { input, ...rest } = source;

  return {
    ...rest,
    input: (typeof input === 'string' ? [input] : input).map(
      mapOpenAIChunkInputToJinaInput,
    ),
  };
};

export const mapOpenAIChunkInputToJinaInput = (
  source: string,
): JinaEmbedChunkInput => {
  if (source.startsWith('http')) {
    return {
      image: source,
    };
  }

  return {
    text: source,
  };
};

export const rerankInputSchema = z.object({
  model: z.enum(['jina-reranker-v2-base-multilingual']),
  query: z.string(),
  top_n: z.number().int().positive().default(1).optional(),
  documents: z.array(z.string()),
});
export type RerankInput = z.infer<typeof rerankInputSchema>;

export const rerankResponseSchema = z
  .object({
    id: z.string().optional(),
    results: z.array(
      z.object({
        index: z.number().int(),
        relevance_score: z.number(),
      }),
    ),
  })
  .and(jinaUsageResponseSchema);
export type RerankResponse = z.infer<typeof rerankResponseSchema>;
