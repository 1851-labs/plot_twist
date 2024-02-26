import Instructor from '@instructor-ai/instructor';
import OpenAI from 'openai';
import { internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { z } from 'zod';

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
});

const ProtagonistAndSettingSchema = z.object({
  protagonist: z
    .string()
    .describe('the main character of the story'),
  setting: z
    .string()
    .describe('the location of the story'),
});

const MIXTRAL_8X7B_INSTRUCT_V01:string = 'mistralai/Mixtral-8x7B-Instruct-v0.1'

export const summarizeTranscript = internalAction({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (_, args) => {
    const { transcript } = args;

    const extract = await client.chat.completions.create({
    messages: [
        {
        role: 'system',
        content:
            'The following is a transcript of a voice message. Extract a title, and summary from it and correctly return JSON.',
        },
        { role: 'user', content: transcript },
    ],
    model: MIXTRAL_8X7B_INSTRUCT_V01,
    response_model: { schema: StorySchema, name: 'Summarizestorys' },
    max_retries: 3,
    });

    return extract;
  },
});

export const extractProtagonistAndSetting = internalAction({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (_, args) => {
    const { transcript } = args;

    const extract = await client.chat.completions.create({
    messages: [
        {
        role: 'system',
        content:
            'The following is a personal story from user. Extract a colorful description of the protagonist and the setting and correctly return JSON.',
        },
        { role: 'user', content: transcript },
    ],
    model: MIXTRAL_8X7B_INSTRUCT_V01,
    response_model: { schema: ProtagonistAndSettingSchema, name: 'ProtagonistAndSetting' },
    max_retries: 3,
    });

    return extract;
  },
});