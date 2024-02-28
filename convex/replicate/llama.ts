('use node');

import Replicate from 'replicate';
import { internal } from '../_generated/api';
import { internalAction } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Interface for calling llama models through replicate.com
 *  The goal is to keep this for calling models and db saving in the appropriate api file above (ie, jokes, stories, etc)
 */

/*
 * TODO: Swap out "summary" for a story embellishment - save to db, display on recording page
 * TODO: Swap out joke creation to use this interface 
 *  - with the new system prompt
 *  - based off the embellished story 
 *  - remove old replicate_joke.ts file
 */

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

const JOKE_SYS_PROMPT:string =  `
    You are a professional joke writer with a whimiscal style. This is a personal story or ancedote, 
    please respond with a joke that is constructed from the story provided. Make the joke safe for children. 
    Your joke should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. 
    Please ensure that your jokes are socially unbiased and positive in nature. 
    Your jokes need to be coherent, but do not need to be factually correct. 
    Take liberties with the story and turn it into a fun and amusing joke! 
    Return JSON.
`;

const STORY_TELLER_SYS_PROMPT:string =  `
    You are a professional story teller. You are telling a story to a group of children.
    Turn the text into a whimiscal story from the perspective of a narrator who is narating a life story.
    Your story should be fun, engaging, and appropriate for children. 
    Your response should only include the story, not other text. 
    Provide no explationations.
`;

const ILLISTRATOR_SYS_PROMPT:string =  `
  You are an illistrator of books for children. You are tasked with creating images that corrpesond with a story. 
  Create a description of one image that could be used to illustrate the story. 
  Your response should only include a description of the image, not other text. 
  Provide no explationations.
`;

const CODE_LLAMA_70B_INSTRUCT:`${string}/${string}:${string}` = "meta/codellama-70b-instruct:a279116fe47a0f65701a8817188601e2fe8f4b9e04a518789655ea7b995851bf";

export const codeLlamaInstruct = internalAction({
    args: {
        prompt: v.string(),
        system_prompt: v.string(),
    },
    handler: async (_, args) => {
        const llamaOutput = (await replicate.run(
            CODE_LLAMA_70B_INSTRUCT,
            {
                input: {
                    prompt: args.prompt,
                    system_prompt: args.system_prompt,
                    debug: false,
                    top_k: 50,
                    top_p: 1,
                    temperature: 0.75,
                    max_new_tokens: 300,
                    min_new_tokens: -1
                },
            },
        )) as [];
        let response:string = llamaOutput.join("");
        return response;
    },
});

export const llamaStoryEmbellisher = internalAction({
    args: {prompt: v.string()}, 
    handler: async (ctx, args) => {
        const story:string = await ctx.runAction(
            internal.replicate.llama.codeLlamaInstruct, 
            {prompt: args.prompt, system_prompt: STORY_TELLER_SYS_PROMPT}) as string;
        return story;
    }
});

export const llamaJoker = internalAction({
    args: {prompt: v.string()}, 
    handler: async (ctx, args) => {
        const joke:string = await ctx.runAction(
            internal.replicate.llama.codeLlamaInstruct, 
            {prompt: args.prompt, system_prompt: JOKE_SYS_PROMPT}) as string;
        return joke;
    }
});

export const llamaIllistrator = internalAction({
    args: {prompt: v.string()}, 
    handler: async (ctx, args) => {
        const image_description:string = await ctx.runAction(
            internal.replicate.llama.codeLlamaInstruct, 
            {prompt: args.prompt, system_prompt: ILLISTRATOR_SYS_PROMPT}) as string;
        return image_description;
    }
});