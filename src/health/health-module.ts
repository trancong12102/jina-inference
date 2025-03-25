import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { responseWithDefaultSchema } from '../lib/openapi';

export const healthModule: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/health',
    schema: {
      tags: ['Health'],
      response: responseWithDefaultSchema({
        200: z.object({
          status: z.string(),
        }),
      }),
    },
    handler: async () => {
      return { status: 'ok' };
    },
  });
};
