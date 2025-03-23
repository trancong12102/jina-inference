import AxiosMockAdapter from 'axios-mock-adapter';
import { eq, sql } from 'drizzle-orm';
import { describe, expect } from 'vitest';
import { testWithDb } from '../../test/context/db-client';
import { keys } from '../lib/db';
import { createHttpClient } from '../lib/http-client';
import type { Key, KeyStatus, UserResponse } from './key-schema';
import { KeyService } from './key-service';

describe.concurrent('key-service', async () => {
  describe('addKey', async () => {
    testWithDb('should add key', async ({ db }) => {
      const httpClient = createHttpClient();
      const mockHttpClient = new AxiosMockAdapter(httpClient);

      const service = new KeyService({ db, httpClient });

      const key = 'test-key';
      const balance = 827304;

      mockHttpClient
        .onGet('https://embeddings-dashboard-api.jina.ai/api/v1/api_key/user', {
          params: {
            api_key: key,
          },
        })
        .reply(200, {
          wallet: {
            total_balance: balance,
          },
        } satisfies UserResponse);

      const result = await service.addKey(key);

      const expectedResponse: Key = {
        key,
        balance,
        usedAt: null,
        using: false,
      };

      expect(result).toEqual(expectedResponse);
    });

    testWithDb('should throw error if key is not found', async ({ db }) => {
      const httpClient = createHttpClient();
      const mockHttpClient = new AxiosMockAdapter(httpClient);

      const service = new KeyService({ db, httpClient });

      const key = 'test-key';

      mockHttpClient
        .onGet('https://embeddings-dashboard-api.jina.ai/api/v1/api_key/user', {
          params: {
            api_key: key,
          },
        })
        .reply(404, {
          error: 'Key not found',
        });

      await expect(service.addKey(key)).rejects.toThrow();
    });

    testWithDb(
      'should update key balance if it already exists',
      async ({ db }) => {
        const httpClient = createHttpClient();
        const mockHttpClient = new AxiosMockAdapter(httpClient);

        const service = new KeyService({ db, httpClient });

        await db.insert(keys).values({
          key: 'test-key',
          balance: 100_000,
          usedAt: null,
          using: false,
        });

        mockHttpClient
          .onGet(
            'https://embeddings-dashboard-api.jina.ai/api/v1/api_key/user',
            {
              params: {
                api_key: 'test-key',
              },
            },
          )
          .reply(200, {
            wallet: {
              total_balance: 200_000,
            },
          } satisfies UserResponse);

        const result = await service.addKey('test-key');

        expect(result.balance).toEqual(200_000);
      },
    );
  });

  describe('getKeyStatus', async () => {
    testWithDb('should get key status', async ({ db }) => {
      const httpClient = createHttpClient();

      const service = new KeyService({ db, httpClient });

      const key = 'test-key';
      const balance = 827304;

      await db.insert(keys).values({
        key,
        balance,
        usedAt: null,
        using: false,
      });

      const result = await service.getKeyStatus();

      expect(result).toEqual({
        totalKeys: 1,
        totalAvailableKeys: 1,
        totalAvailableBalance: BigInt(balance),
        totalBalance: BigInt(balance),
      } satisfies KeyStatus);
    });
  });

  describe('useBestKey', async () => {
    testWithDb('should use best key', async ({ db }) => {
      const httpClient = createHttpClient();

      const service = new KeyService({ db, httpClient });

      await db.insert(keys).values({
        key: 'test-key-1',
        balance: 900_000,
        usedAt: null,
        using: false,
      });

      await db.insert(keys).values({
        key: 'test-key-2',
        balance: 1_000_000,
        usedAt: null,
        using: false,
      });

      const result = await service.useBestKey();

      // use key 2
      expect(result.balance).toEqual(1_000_000);
      expect(result.usedAt).not.toBeNull();
      expect(result.using).toBe(true);
      expect(result.key).toEqual('test-key-2');

      // decrease balance of key 2 to equal balance of key 1 and set using to false
      await db
        .update(keys)
        .set({ balance: 900_000, using: false })
        .where(eq(keys.key, 'test-key-2'));

      // use key 1
      const result2 = await service.useBestKey();

      expect(result2.balance).toEqual(900_000);
      expect(result2.usedAt).not.toBeNull();
      expect(result2.using).toBe(true);
      expect(result2.key).toEqual('test-key-1');
    });

    testWithDb('should throw error if no key is available', async ({ db }) => {
      const httpClient = createHttpClient();

      const service = new KeyService({ db, httpClient });

      await expect(service.useBestKey()).rejects.toThrow();
    });

    testWithDb(
      'should use key if it is not used for 5 minutes',
      async ({ db }) => {
        const httpClient = createHttpClient();

        const service = new KeyService({ db, httpClient });

        await db.insert(keys).values({
          key: 'test-key-1',
          balance: 900_000,
          usedAt: null,
          using: true,
        });

        await db
          .update(keys)
          .set({ usedAt: sql`CURRENT_TIMESTAMP - INTERVAL '6 minutes'` })
          .where(eq(keys.key, 'test-key-1'));

        const result = await service.useBestKey();

        expect(result.balance).toEqual(900_000);
        expect(result.usedAt).not.toBeNull();
        expect(result.using).toBe(true);
      },
    );

    testWithDb(
      'should not use key if it has less than 100000 balance',
      async ({ db }) => {
        const httpClient = createHttpClient();

        const service = new KeyService({ db, httpClient });

        await db.insert(keys).values({
          key: 'test-key-1',
          balance: 90_000,
          usedAt: null,
          using: false,
        });

        await expect(service.useBestKey()).rejects.toThrow();
      },
    );
  });

  describe('releaseKey', async () => {
    testWithDb('should release key', async ({ db }) => {
      const httpClient = createHttpClient();

      const service = new KeyService({ db, httpClient });

      await db.insert(keys).values({
        key: 'test-key-1',
        balance: 900_000,
        usedAt: null,
        using: true,
      });

      await service.releaseKey('test-key-1', 100_000);

      const result = await db
        .select()
        .from(keys)
        .where(eq(keys.key, 'test-key-1'));

      expect(result).toEqual([expect.objectContaining({ balance: 800_000 })]);
    });
  });
});
