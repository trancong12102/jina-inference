import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

export const healthModule: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/health',
    schema: {
      tags: ['Health'],
      response: {
        200: z.object({
          status: z.string(),
        }),
      },
    },
    handler: async () => {
      return { status: 'ok' };
    },
  });
};
