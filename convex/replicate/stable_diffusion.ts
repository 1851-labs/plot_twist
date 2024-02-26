('use node');

import Replicate from 'replicate';
import { internalAction } from '../_generated/server';
import { v } from 'convex/values';


const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const SDXL_LIGHTNING_4STEP:`${string}/${string}:${string}` = "lucataco/sdxl-lightning-4step:727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a"

const DEFAULT_NEGATIVE_PROMPT:string = "worst quality, low quality, bad quality, blurry";

export const generateImage = internalAction({
    args: {
        prompt: v.string(),
        negative_prompt: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
    },
    handler: async (_, args) => {

    const output = await replicate.run(
        SDXL_LIGHTNING_4STEP,
        {
            input: {
                width: args.width || 1024,
                height: args.height || 1024,
                prompt: args.prompt,
                scheduler: "K_EULER",
                num_outputs: 1,
                guidance_scale: 0,
                negative_prompt: args.negative_prompt || DEFAULT_NEGATIVE_PROMPT,
                num_inference_steps: 4
            }
        }
        );

    }
});
