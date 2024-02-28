import Instructor from '@instructor-ai/instructor';
import OpenAI from 'openai';
import { internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { z } from 'zod';

/*
 * A benefit of together AI is that it's API is compatible with OpenAI sdk which enables use of this Instructor tool
 */

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

/*
 * Model zoo
 */

const MIXTRAL_8X7B_INSTRUCT_V01:string = 'mistralai/Mixtral-8x7B-Instruct-v0.1'

/*
 * Story summarization
 */
const StorySchema = z.object({
  title: z
    .string()
    .describe('Short descriptive title of what the story is about'),
  summary: z
    .string()
    .describe('A short summary of the story'),
});
const SUMMRIZE_SYS_PROMPT:string = `
    The following is a transcript of a voice message. Extract a title, and summary from it and correctly. 
    The summary should be shorter than the original transcript, use only the details and facts found in the transcript.
    If possible make the title cute, whimsical, and fun. Include a pun in the title if possible.
    Keep the title short and sweet, no more than 10 words. Include a few relevant emojies if possible.
    Return JSON.
`
export const summarizeTranscript = internalAction({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (_, args) => {
    const { transcript } = args;
    const extract = await client.chat.completions.create({
    messages: [
        { role: 'system', content: SUMMRIZE_SYS_PROMPT },
        { role: 'user', content: transcript },
    ],
    model: MIXTRAL_8X7B_INSTRUCT_V01,
    response_model: { schema: StorySchema, name: 'SummarizeStories' },
    max_retries: 3,
    });
    return extract;
  },
});

/*
 * Extract protagonist and setting
 */
const StoryDetailsSchema = z.object({
    protagonist: z
        .string()
        .describe('the main character of the story'),
    setting: z
        .string()
        .describe('the location of the story'),
    conflict: z
        .string()
        .describe('the main conflict of the story'),
});
const STORY_DETAILS_SYS_PROMPT:string = `
    The following is a personal story from user. 
    Extract a detailed description of the protagonist, setting and conflict. 
    Do not make up any information, use only the information provided in the story. 
    If there is insufficient information, return a message indicating that.
    Return JSON.
`
export const extractStoryDetails = internalAction({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (_, args) => {
    const { transcript } = args;
    const extract = await client.chat.completions.create({
        messages: [
            { role: 'system', content: STORY_DETAILS_SYS_PROMPT },
            { role: 'user', content: transcript },
        ],
        model: MIXTRAL_8X7B_INSTRUCT_V01,
        response_model: { schema: StoryDetailsSchema, name: 'StoryDetails' },
        max_retries: 5,
    });
    return extract;
  },
});

/*
 * Joke creation
 * *Note: an issue with this approach is the responses are extremely stable and more boring than llama2 (in some quick testing)
 */
const JokeSchema = z.object({
    joke: z
        .string()
        .describe('A fun whimiscal joke based on the story'),
});
const JOKE_SYS_PROMPT:string =  `
    You are a professional joke writer with a whimiscal style.
    This is a personal story or ancedote, please respond with a joke that is constructed from the story provided. 
    Your joke should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. 
    Please ensure that your jokes are socially unbiased and positive in nature. 
    Your jokes need to be coherent, but do not need to be factually correct.
    Take liberties with the story and turn it into a fun and amusing joke! 
    If possible use a few emojies in the joke to make it more fun.
    Return JSON.
`;
export const createJokeFromStory = internalAction({
  args: {
    story: v.string(),
  },
  handler: async (_, args) => {
    const { story } = args;
    const extract = await client.chat.completions.create({
        messages: [
            { role: 'system', content: JOKE_SYS_PROMPT },
            { role: 'user', content: story },
        ],
        model: MIXTRAL_8X7B_INSTRUCT_V01,
        temperature: 0.7,
        response_model: { schema: JokeSchema, name: 'Joke' },
        max_retries: 3,
    });
    return extract.joke;
  },
});

/*
 * Image description
 */
const ImageDescSchema = z.object({
    imageDescription: z
        .string()
        .describe('A description of an image which illistrates the story'),
});
const IMAGE_DESC_SYS_PROMPT_V1:string = `
    You are an illistrator of books for children. Your style is whimiscal, nostalgic and colorful.
    You are tasked with creating images for the following story. 
    Create a description of an image to be used to illustrate the protagonist and setting of the story.
    Make sure a description of the protangonist and setting are part of the image description.
    Return JSON.
`
const IMAGE_DESC_SYS_PROMPT_V2:string = `
    Turn the following story into a terse but detailed description of an image.
    Return JSON.
`

export const createImageDescStory = internalAction({
  args: {
    story: v.string(),
  },
  handler: async (_, args) => {
    const { story } = args;
    const extract = await client.chat.completions.create({
        messages: [
            { role: 'system', content: IMAGE_DESC_SYS_PROMPT_V2 },
            { role: 'user', content: story },
        ],
        model: MIXTRAL_8X7B_INSTRUCT_V01,
        temperature: 0.3,
        response_model: { schema: ImageDescSchema, name: 'ImageDescription' },
        max_retries: 3,
    });
    return extract.imageDescription;
  },
});
