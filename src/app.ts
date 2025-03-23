import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import fastify from 'fastify';
import {
  type FastifyZodOpenApiTypeProvider,
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransform,
  fastifyZodOpenApiTransformObject,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-zod-openapi';
import type { ZodOpenApiVersion } from 'zod-openapi';
import 'zod-openapi/extend';
import { description, version } from '../package.json' with { type: 'json' };
import { healthModule } from './health/health-module';
import { keyModule } from './key/key-module';
import { dbModule } from './lib/db';
import { diContainer } from './lib/di';
import { type Env, envModule } from './lib/env';
import { httpClientModule } from './lib/http-client';
import { proxyModule } from './proxy/proxy-module';

export const createApp = async (env: Env) => {
  // Create fastify app instance
  const app = fastify({
    logger: true,
  })
    .setValidatorCompiler(validatorCompiler)
    .setSerializerCompiler(serializerCompiler)
    .withTypeProvider<FastifyZodOpenApiTypeProvider>();

  // Register plugins
  await app.register(fastifyZodOpenApiPlugin);
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: description,
        version,
      },
      openapi: '3.1.0' satisfies ZodOpenApiVersion,
    },
    transform: fastifyZodOpenApiTransform,
    transformObject: fastifyZodOpenApiTransformObject,
  });
  await app.register(fastifyApiReference, {
    routePrefix: '/api-docs',
  });

  // register libs
  await app.register(diContainer);
  await app.register(envModule, {
    env,
  });
  await app.register(dbModule);
  await app.register(httpClientModule);

  // register modules
  await app.register(keyModule);
  await app.register(proxyModule);
  await app.register(healthModule);

  return app;
};
