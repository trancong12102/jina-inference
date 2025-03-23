import type { Cradle } from '@fastify/awilix';
import type { KeyService } from '../key/key-service';
import type { HttpClient } from '../lib/http-client';
import { parseResponse } from '../lib/http-client';
import {
  type EmbedInput,
  type EmbedResponse,
  type JinaUsageResponse,
  type RerankInput,
  type RerankResponse,
  embedResponseSchema,
  mapOpenAIEmbedInputToJinaInput,
  rerankResponseSchema,
} from './proxy-schema';

const JINA_API_BASE_URL = 'https://api.jina.ai/v1';

export class ProxyService {
  private readonly httpClient: HttpClient;
  private readonly keyService: KeyService;

  constructor({ httpClient, keyService }: Dependencies) {
    this.httpClient = httpClient;
    this.keyService = keyService;
  }

  async embed(input: EmbedInput): Promise<EmbedResponse> {
    return this.withKey(async (key) => {
      const response = await this.httpClient.post(
        `${JINA_API_BASE_URL}/embeddings`,
        mapOpenAIEmbedInputToJinaInput(input),
        {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        },
      );
      return parseResponse(response, embedResponseSchema);
    });
  }

  async rerank(input: RerankInput): Promise<RerankResponse> {
    return this.withKey(async (key) => {
      const response = await this.httpClient.post(
        `${JINA_API_BASE_URL}/rerank`,
        input,
        {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        },
      );
      return parseResponse(response, rerankResponseSchema);
    });
  }

  async withKey<T extends JinaUsageResponse>(
    fn: (key: string) => Promise<T>,
  ): Promise<T> {
    const { key } = await this.keyService.useBestKey();

    try {
      const response = await fn(key);

      await this.keyService.releaseKey(key, response.usage.total_tokens);

      return response;
    } finally {
      await this.keyService.releaseKey(key, 0);
    }
  }
}

type Dependencies = Pick<Cradle, 'httpClient' | 'keyService'>;
