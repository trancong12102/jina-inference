import { describe, expect, it } from 'vitest';
import { testWithDb } from '../../test/context/db-client';
import { KeyService } from '../key/key-service';
import { createHttpClient } from '../lib/http-client';
import { ProxyService } from './proxy-service';

testWithDb.concurrent('proxy-service', async ({ db }) => {
  const httpClient = createHttpClient();
  const keyService = new KeyService({ db, httpClient });

  const keysEnv = process.env.JINA_TEST_KEYS;
  if (!keysEnv) {
    throw new Error('JINA_TEST_KEYS is not set');
  }

  const keys = keysEnv.split(',');

  await Promise.all(keys.map((key) => keyService.addKey(key)));

  const keyStatus = await keyService.getKeyStatus();
  expect(keyStatus.totalAvailableBalance).toBeGreaterThan(100_000);

  describe('embed', async () => {
    it('should embed', async () => {
      const proxyService = new ProxyService({ httpClient, keyService });

      const result = await proxyService.embed({
        model: 'jina-clip-v2',
        input: 'Hello, world!',
      });

      expect(result.data.length).toEqual(1);
      expect(result.data[0].embedding.length).toEqual(1024);
    });

    it('should embed image if provided', async () => {
      const proxyService = new ProxyService({ httpClient, keyService });

      const result = await proxyService.embed({
        model: 'jina-clip-v2',
        input: ['Hello', 'https://i.ibb.co/nQNGqL0/beach1.jpg'],
      });

      expect(result.data.length).toEqual(2);
      expect(result.data[0].embedding.length).toEqual(1024);
      expect(result.data[1].embedding.length).toEqual(1024);
    });
  });

  describe('rerank', async () => {
    it('should rerank', async () => {
      const proxyService = new ProxyService({ httpClient, keyService });

      const result = await proxyService.rerank({
        model: 'jina-reranker-v2-base-multilingual',
        query: 'Hello, world!',
        documents: ['Hahaha', 'Hello, world!'],
        top_n: 1,
      });

      expect(result.results.length).toEqual(1);
      expect(result.results[0].index).toEqual(1);
    });

    it('should correct fixed relevance_score to 8 decimal places', async () => {
      const proxyService = new ProxyService({ httpClient, keyService });

      const result = await proxyService.rerank({
        model: 'jina-reranker-v2-base-multilingual',
        query: 'Hello, world!',
        documents: ['Hahaha', 'Hello, world!'],
        top_n: 1,
      });

      expect(result.results[0].relevance_score).toEqual(1);
      expect(result.results[1].relevance_score.toString()).toEqual(
        result.results[0].relevance_score.toFixed(8),
      );
    });
  });
});
