import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { test } from 'vitest';
import type { DbClient } from '../../src/lib/db';

export const testWithDb = test.extend<{
  db: DbClient;
}>({
  // biome-ignore lint/correctness/noEmptyPattern: <explanation>
  db: async ({}, use) => {
    const db = drizzle();
    await migrate(db, {
      migrationsFolder: './drizzle',
    });

    await use(db as unknown as DbClient);
  },
});
