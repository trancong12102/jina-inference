import { asClass } from 'awilix';
import fastifyPlugin from 'fastify-plugin';
import { proxyRouter } from './proxy-router';
import { ProxyService } from './proxy-service';

export const proxyModule = fastifyPlugin(
  async (app) => {
    const { diContainer } = app;

    diContainer.register({
      proxyService: asClass(ProxyService, {
        lifetime: 'SINGLETON',
      }),
    });

    await app.register(proxyRouter);
  },
  {
    name: 'proxy-module',
  },
);

declare module '@fastify/awilix' {
  interface Cradle {
    proxyService: ProxyService;
  }
}
