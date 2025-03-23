import { asValue } from 'awilix';
import axios, { type AxiosResponse } from 'axios';
import fastifyPlugin from 'fastify-plugin';
import type { ZodTypeAny, z } from 'zod';
import { fromError } from 'zod-validation-error';

export const createHttpClient = () =>
  axios.create({
    adapter: 'fetch',
  });
export type HttpClient = ReturnType<typeof createHttpClient>;

export const httpClientModule = fastifyPlugin(
  async (app) => {
    const { diContainer } = app;
    diContainer.register({
      httpClient: asValue(createHttpClient()),
    });
  },
  {
    name: 'httpClient',
  },
);

declare module '@fastify/awilix' {
  interface Cradle {
    httpClient: HttpClient;
  }
}

export class ResponseSchemaError extends Error {
  public readonly rawData: unknown;

  constructor(rawData: unknown, cause: unknown) {
    super(fromError(cause).message);
    this.rawData = rawData;
  }
}

export const parseResponse = async <Schema extends ZodTypeAny>(
  response: AxiosResponse<unknown>,
  schema: Schema,
) => {
  const { data } = response;

  try {
    const parsedData = schema.parse(data);
    return parsedData as z.infer<Schema>;
  } catch (error: unknown) {
    throw new ResponseSchemaError(data, error);
  }
};
