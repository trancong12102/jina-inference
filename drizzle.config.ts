import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { parseEnv } from './src/lib/env';

const { DATABASE_URL } = parseEnv();

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
});
