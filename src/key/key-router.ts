import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { createKeyInputSchema, keySchema, keyStatusSchema } from './key-schema';

const TAGS = ['Key'];

export const keyRouter: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get(
    '/status',
    {
      schema: {
        tags: TAGS,
        summary: 'Get keys status',
        response: {
          200: keyStatusSchema.openapi({
            ref: 'KeyStatus',
            description: 'Keys status',
          }),
        },
      },
    },
    async (_, reply) => {
      const { diContainer } = app;
      const keyService = diContainer.resolve('keyService');

      const keyStatus = await keyService.getKeyStatus();
      return reply.status(200).send(keyStatus);
    },
  );

  app.post(
    '/',
    {
      schema: {
        tags: TAGS,
        summary: 'Create key',
        body: createKeyInputSchema,
        response: {
          201: keySchema.openapi({
            ref: 'Key',
            description: 'Created key',
          }),
        },
      },
    },
    async (req, reply) => {
      const { diContainer } = app;
      const keyService = diContainer.resolve('keyService');

      const { key } = req.body;
      const createdKey = await keyService.addKey(key);

      return reply.status(201).send(createdKey);
    },
  );
};
