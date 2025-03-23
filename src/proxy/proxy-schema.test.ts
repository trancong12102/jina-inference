import { describe, expect, it } from 'vitest';
import { mapOpenAIEmbedInputToJinaInput } from './proxy-schema';

describe.concurrent('proxy-schema', () => {
  describe('mapOpenAIEmbedInputToJinaInput', () => {
    it('should map openai embed input to jina embed input', () => {
      const result = mapOpenAIEmbedInputToJinaInput({
        input: 'Hello, world!',
        model: 'jina-clip-v2',
      });

      expect(result).toEqual({
        input: [{ text: 'Hello, world!' }],
        model: 'jina-clip-v2',
      });
    });

    it('should map openai embed input to jina embed input with multiple strings', () => {
      const result = mapOpenAIEmbedInputToJinaInput({
        input: ['Hello, world!', 'Hello, world!'],
        model: 'jina-clip-v2',
      });

      expect(result).toEqual({
        input: [{ text: 'Hello, world!' }, { text: 'Hello, world!' }],
        model: 'jina-clip-v2',
      });
    });

    it('should map openai embed input to jina embed input with multiple strings and one image', () => {
      const result = mapOpenAIEmbedInputToJinaInput({
        input: ['Hello, world!', 'https://i.ibb.co/nQNGqL0/beach1.jpg'],
        model: 'jina-clip-v2',
      });

      expect(result).toEqual({
        input: [
          { text: 'Hello, world!' },
          { image: 'https://i.ibb.co/nQNGqL0/beach1.jpg' },
        ],
        model: 'jina-clip-v2',
      });
    });
  });
});
