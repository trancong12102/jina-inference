import { asValue } from 'awilix';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import fastifyPlugin from 'fastify-plugin';
import type { Env } from './env';

export const keys = pgTable('keys', {
  key: varchar().primaryKey(),
  balance: integer().notNull(),
  usedAt: timestamp('used_at', {
    withTimezone: true,
    mode: 'date',
  }),
  using: boolean().notNull().default(false),
});

export const createDbClient = ({ DATABASE_URL }: Pick<Env, 'DATABASE_URL'>) =>
  drizzle(DATABASE_URL, {
    schema: {
      keys,
    },
  });
export type DbClient = ReturnType<typeof createDbClient>;

export const dbModule = fastifyPlugin(
  async (app) => {
    const { diContainer } = app;

    const { DATABASE_URL } = diContainer.resolve('env');

    // create db client
    const db = createDbClient({ DATABASE_URL });

    // migrate db
    await migrate(db, {
      migrationsFolder: './drizzle',
    });

    // register db client
    diContainer.register({
      db: asValue(db),
    });
  },
  {
    name: 'db',
  },
);

declare module '@fastify/awilix' {
  interface Cradle {
    db: DbClient;
  }
}
