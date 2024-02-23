('use node');

import { internalAction, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import Replicate from 'replicate';
import { api, internal } from './_generated/api';
import { isRunnableFunctionWithParse } from 'openai/lib/RunnableFunction';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

interface llamaOutput {
    log: string;
}

export const chat = internalAction({
    args: {
        prompt: v.string(),
        id: v.id('stories'),
    },
    handler: async (ctx, args) => {
        const replicateOutput = (await replicate.run(
            'meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3',
            {
                input: {
                    prompt: args.prompt,
                    system_prompt: "You are a professional joke writer with a whimiscal style. This is a personal story or ancedote, please respond with a joke that is constructed from the story provided. Make the joke safe for children. Your joke should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your jokes are socially unbiased and positive in nature.\n\n Your jokes need to be coherent, but do not need to be factually correct. Take liberties with the story and turn it into a fun and amusing joke! Do not include any text other than the joke. Provide no explationation.",
                    debug: false,
                    top_k: 50,
                    top_p: 1,
                    temperature: 0.75,
                    max_new_tokens: 700,
                    min_new_tokens: -1
                },
            },
        )) as [];

        let response:string = replicateOutput.join("");
        await ctx.runMutation(internal.replicate_joke.saveJoke, {
            story_id: args.id,
            joke: response,
        });
    },
});

export const saveJoke = internalMutation({
    args: {
        story_id: v.id('stories'),
        joke: v.string(),
    },
    handler: async (ctx, args) => {
        const { story_id, joke } = args;
        let story = await ctx.db.get(story_id);

        if (!story) {
          console.error(`Couldn't find story ${story_id}`);
          return;
        }
   
        await ctx.db.insert('jokes', {
          joke: joke,
          storyId: story_id,
          userId: story.userId,
          generatingJoke: false,
        });

        await ctx.db.patch(story_id, {
            generatingActionItems: false,
        });

    },
});