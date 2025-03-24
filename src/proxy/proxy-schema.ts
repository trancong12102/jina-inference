import { z } from 'zod';

export const embedInputSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.enum(['jina-clip-v2', 'jina-embeddings-v3']),
  task: z
    .enum(['retrieval.passage', 'retrieval.query', 'text-matching'])
    .default('text-matching')
    .optional(),
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

export const mapJinaRerankResponseToCohereRerankResponse = (
  source: RerankResponse,
): RerankResponse => {
  // keep only 8 decimal places for relevance_score
  return {
    ...source,
    results: source.results.map((result) => ({
      ...result,
      relevance_score: Number.parseFloat(result.relevance_score.toFixed(8)),
    })),
  };
};
