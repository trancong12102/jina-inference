import { asClass } from 'awilix';
import fastifyPlugin from 'fastify-plugin';
import { keyRouter } from './key-router';
import { KeyService } from './key-service';

export const keyModule = fastifyPlugin(
  async (app) => {
    const { diContainer } = app;
    diContainer.register({
      keyService: asClass(KeyService, {
        lifetime: 'SINGLETON',
      }),
    });

    await app.register(keyRouter, {
      prefix: '/keys',
    });
  },
  {
    name: 'key-module',
  },
);

declare module '@fastify/awilix' {
  interface Cradle {
    keyService: KeyService;
  }
}
