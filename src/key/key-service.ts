import type { Cradle } from '@fastify/awilix';
import { and, count, desc, eq, gt, sql, sum } from 'drizzle-orm';
import { type DbClient, keys } from '../lib/db';
import { type HttpClient, parseResponse } from '../lib/http-client';
import {
  type Key,
  type KeyStatus,
  type User,
  mapUserResponseToUser,
  userResponseSchema,
} from './key-schema';

export class KeyService {
  private readonly db: DbClient;
  private readonly httpClient: HttpClient;

  constructor({ db, httpClient }: Dependencies) {
    this.db = db;
    this.httpClient = httpClient;
  }

  async getKeyStatus(): Promise<KeyStatus> {
    const [{ availableKeys, availableBalance }] = await this.db
      .select({
        availableKeys: count(keys.key),
        availableBalance: sum(keys.balance),
      })
      .from(keys)
      .where(eq(keys.using, false));

    const [{ totalKeys, totalBalance }] = await this.db
      .select({
        totalKeys: count(keys.key),
        totalBalance: sum(keys.balance),
      })
      .from(keys);

    return {
      totalBalance: totalBalance ? BigInt(totalBalance) : 0n,
      totalKeys,
      totalAvailableKeys: availableKeys,
      totalAvailableBalance: availableBalance ? BigInt(availableBalance) : 0n,
    };
  }

  async useBestKey(): Promise<Key> {
    return await this.db.transaction(async (tx) => {
      const [key] = await tx
        .select()
        .from(keys)
        .for('update', {
          skipLocked: true,
        })
        .limit(1)
        .where(and(gt(keys.balance, 100_000), eq(keys.using, false)))
        .orderBy(desc(keys.balance), sql`${keys.usedAt} ASC NULLS FIRST`);

      if (!key) {
        throw new Error('No key found');
      }

      const [updatedKey] = await tx
        .update(keys)
        .set({
          usedAt: new Date(),
          using: true,
        })
        .where(eq(keys.key, key.key))
        .returning();

      return updatedKey;
    });
  }

  async releaseKey(key: string, usedTokens: number): Promise<void> {
    await this.db
      .update(keys)
      .set({
        balance: sql`${keys.balance} - ${usedTokens}`,
        using: false,
      })
      .where(eq(keys.key, key));
  }

  async addKey(key: string): Promise<Key> {
    const user = await this.fetchJinaUser(key);
    const {
      wallet: { totalBalance },
    } = user;
    const [createdKey] = await this.db
      .insert(keys)
      .values({ key, balance: totalBalance })
      .returning();

    return createdKey;
  }

  async fetchJinaUser(key: string): Promise<User> {
    const response = await this.httpClient.get(
      'https://embeddings-dashboard-api.jina.ai/api/v1/api_key/user',
      {
        params: {
          api_key: key,
        },
      },
    );

    const data = await parseResponse(response, userResponseSchema);

    return mapUserResponseToUser(data);
  }
}

type Dependencies = Pick<Cradle, 'db' | 'httpClient'>;
