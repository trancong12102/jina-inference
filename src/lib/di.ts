import { fastifyAwilixPlugin } from '@fastify/awilix';
import fastifyPlugin from 'fastify-plugin';

export const diContainer = fastifyPlugin(
  async (app) => {
    await app.register(fastifyAwilixPlugin, {
      disposeOnClose: true,
      disposeOnResponse: true,
      strictBooleanEnforced: true,
    });
  },
  {
    name: 'di',
  },
);
