('use node');

import Replicate from 'replicate';
import { internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';


/**
 * Interface for calling mixtral models through replicate.com
 *  The goal is to keep this for calling models and db saving in the appropriate api file above (ie, jokes, stories, etc)
 */

/*
 * A downside of replicate API & SDK is that its not compatible with Instructor SDK for pulling out structured data.
 */

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});


const MINSTRAL_7B_INSTRUCT_V02:`${string}/${string}:${string}` = "mistralai/mistral-7b-instruct-v0.2:f5701ad84de5715051cb99d550539719f8a7fbcf65e0e62a3d1eb3f94720764e";
const MIXTRAL_8X7B_INSTRUCT_V01:`${string}/${string}:${string}` = "mistralai/mixtral-8x7b-instruct-v0.1:5d78bcd7a992c4b793465bcdcf551dc2ab9668d12bb7aa714557a21c1e77041c"

export const runMixtral7BInstruct = internalAction({
    args: {
        prompt: v.string(),
        prompt_template: v.optional(v.string()),
    },
    handler: async (_, args) => {
        const prompt_template:string = args.prompt_template || "<s>[INST] {prompt} [/INST] ";
        const mixtralOutput = await replicate.run(
            MIXTRAL_8X7B_INSTRUCT_V01,
            {
            input: {
                top_k: 50,
                top_p: 0.9,
                prompt: args.prompt,
                temperature: 0.6,
                max_new_tokens: 512,
                prompt_template: prompt_template,
                presence_penalty: 0,
                frequency_penalty: 0
            }
            }
        ) as [];
        let mixtralOutputString = mixtralOutput.join('');
        return mixtralOutputString;    
    }
});

const STORY_ILLISTRATOR_PROMPT_TEMPLATE:string = `
<s>[INST] 
You are an illistrator of books for children. You are tasked with creating images for the following story. 
Create a description of an image to be used to illustrate the protagonist and setting of the story. 
Your response should only include a description of the image, no other text. 
Make sure the protangonist and setting are described in the image.
Provide no explationations. 

story: '{prompt}' 
[/INST] 
`

export const mixtralIllistrator = internalAction({
    args: {
        story: v.string(),
    },
    handler: async (ctx, args) => {
        const imageDescription:string = await ctx.runAction(
            internal.replicate.mixtral.runMixtral7BInstruct,
            {prompt: args.story, prompt_template: STORY_ILLISTRATOR_PROMPT_TEMPLATE}
        ) as string;
        return imageDescription;
    }
});

const IMAGE_DESC_PROMPT_TEMPLATE:string = `
<s>[INST] 
Turn this story: "{prompt}" into a terse but detailed description of an image. Make sure the protagonist and setting are described.
[/INST] 
`
export const mixtralImageDescription = internalAction({
    args: {
        story: v.string(),
    },
    handler: async(ctx, args) => {
        const imageDescription:string = await ctx.runAction(
            internal.replicate.mixtral.runMixtral7BInstruct,
            {prompt: args.story, prompt_template: IMAGE_DESC_PROMPT_TEMPLATE}
        ) as string;
        return imageDescription;
    }
});
