import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import {
  embedInputSchema,
  embedResponseSchema,
  rerankInputSchema,
  rerankResponseSchema,
} from './proxy-schema';

const TAGS = ['Proxy'];

export const proxyRouter: FastifyPluginAsyncZodOpenApi = async (app) => {
  const { diContainer } = app;

  const proxyService = diContainer.resolve('proxyService');

  app.post(
    '/v1/embeddings',
    {
      schema: {
        tags: TAGS,
        summary: 'Create embeddings',
        operationId: 'createEmbeddings',
        description:
          'Create embeddings for a given text or image. Compatible with OpenAI API.',
        body: embedInputSchema,
        response: {
          200: embedResponseSchema.openapi({
            description: 'Embeddings',
          }),
        },
      },
    },
    async (request, reply) => {
      const { body } = request;

      const response = await proxyService.embed(body);

      return reply.status(200).send(response);
    },
  );

  app.post(
    '/v1/rerank',
    {
      schema: {
        tags: TAGS,
        summary: 'Rerank documents',
        operationId: 'rerankDocuments',
        description:
          'Rerank documents for a given query. Compatible with Cohere API.',
        body: rerankInputSchema,
        response: {
          200: rerankResponseSchema.openapi({
            description: 'Reranked documents',
          }),
        },
      },
    },
    async (request, reply) => {
      const { body } = request;

      const response = await proxyService.rerank(body);

      return reply.status(200).send(response);
    },
  );
};
