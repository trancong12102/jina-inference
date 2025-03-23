import { asValue } from 'awilix';
import fastifyPlugin from 'fastify-plugin';
import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5555),
  DATABASE_URL: z.string().url(),
});
export type Env = z.infer<typeof configSchema>;

export const parseEnv = (data?: unknown) =>
  configSchema.parse(data ?? process.env);

export const envModule = fastifyPlugin<EnvModuleOptions>(
  async (app, { env }) => {
    const { diContainer } = app;
    diContainer.register({
      env: asValue(env),
    });
  },
  {
    name: 'env',
  },
);

type EnvModuleOptions = {
  env: Env;
};

declare module '@fastify/awilix' {
  interface Cradle {
    env: Env;
  }
}
