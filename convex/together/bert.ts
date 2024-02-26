import OpenAI from 'openai';
import { internalAction } from './../_generated/server';
import { v } from 'convex/values';

const togetherApiKey = process.env.TOGETHER_API_KEY ?? 'undefined';

// Together client for LLM extraction
const togetherai = new OpenAI({
  apiKey: togetherApiKey,
  baseURL: 'https://api.together.xyz/v1',
});

export const getEmbedding = internalAction({
  args: {
    str: v.string(),
  },
  handler: async (_, args) => {
    const getEmbedding = await togetherai.embeddings.create({
      input: [args.str.replace('/n', ' ')],
      model: 'togethercomputer/m2-bert-80M-32k-retrieval',
    });
    const embedding = getEmbedding.data[0].embedding;
    return embedding;
  },
});
