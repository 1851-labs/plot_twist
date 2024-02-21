import OpenAI from 'openai';
import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import Instructor from '@instructor-ai/instructor';
import { z } from 'zod';
import { actionWithUser } from './utils';

const togetherApiKey = process.env.TOGETHER_API_KEY ?? 'undefined';

// Together client for LLM extraction
const togetherai = new OpenAI({
  apiKey: togetherApiKey,
  baseURL: 'https://api.together.xyz/v1',
});

// Instructor for returning structured JSON
const client = Instructor({
  client: togetherai,
  mode: 'TOOLS',
});

const StorySchema = z.object({
  title: z
    .string()
    .describe('Short descriptive title of what the story is about'),
  summary: z
    .string()
    .describe('A short summary of the story'),
  actionItems: z // TODO: Remove action items as they are irrelevant
    .array(z.string())
    .describe(
      'A list of action items from the voice story, short and to the point. Make sure all action item lists are fully resolved if they are nested',
    ),
});

export const chat = internalAction({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    const { transcript } = args;

    try {
      const extract = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'The following is a transcript of a voice message. Extract a title, summary, and relevant actions from it and correctly return JSON.',
          },
          { role: 'user', content: transcript },
        ],
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        response_model: { schema: StorySchema, name: 'Summarizestorys' },
        max_retries: 3,
      });

      await ctx.runMutation(internal.together.saveSummary, {
        id: args.id,
        summary: extract.summary,
        actionItems: extract.actionItems,
        title: extract.title,
      });
    } catch (e) {
      console.error('Error extracting from voice message', e);
      await ctx.runMutation(internal.together.saveSummary, {
        id: args.id,
        summary: 'Summary failed to generate',
        actionItems: [],
        title: 'Title',
      });
    }
  },
});

export const getTranscript = internalQuery({
  args: {
    id: v.id('stories'),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const story = await ctx.db.get(id);
    return story?.transcription;
  },
});

export const saveSummary = internalMutation({
  args: {
    id: v.id('stories'),
    summary: v.string(),
    title: v.string(),
    actionItems: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, summary, actionItems, title } = args;
    await ctx.db.patch(id, {
      summary: summary,
      title: title,
      generatingTitle: false,
    });

    let story = await ctx.db.get(id);

    if (!story) {
      console.error(`Couldn't find story ${id}`);
      return;
    }
    for (let actionItem of actionItems) {
      await ctx.db.insert('actionItems', {
        task: actionItem,
        storyId: id,
        userId: story.userId,
      });
    }

    await ctx.db.patch(id, {
      generatingActionItems: false,
    });
  },
});

export type SearchResult = {
  id: string;
  score: number;
};

export const similarstories = actionWithUser({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args): Promise<SearchResult[]> => {
    const getEmbedding = await togetherai.embeddings.create({
      input: [args.searchQuery.replace('/n', ' ')],
      model: 'togethercomputer/m2-bert-80M-32k-retrieval',
    });
    const embedding = getEmbedding.data[0].embedding;

    // 2. Then search for similar stories
    const results = await ctx.vectorSearch('stories', 'by_embedding', {
      vector: embedding,
      limit: 16,
      filter: (q) => q.eq('userId', ctx.userId), // Only search my stories.
    });

    console.log({ results });

    return results.map((r) => ({
      id: r._id,
      score: r._score,
    }));
  },
});

export const embed = internalAction({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    const getEmbedding = await togetherai.embeddings.create({
      input: [args.transcript.replace('/n', ' ')],
      model: 'togethercomputer/m2-bert-80M-32k-retrieval',
    });
    const embedding = getEmbedding.data[0].embedding;

    await ctx.runMutation(internal.together.saveEmbedding, {
      id: args.id,
      embedding,
    });
  },
});

export const saveEmbedding = internalMutation({
  args: {
    id: v.id('stories'),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const { id, embedding } = args;
    await ctx.db.patch(id, {
      embedding: embedding,
    });
  },
});
