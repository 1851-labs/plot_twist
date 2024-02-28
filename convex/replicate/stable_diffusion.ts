('use node');

import Replicate from 'replicate';
import { internalAction } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Interface for calling stable diffusion models through replicate.com
 *  The goal is to keep this for calling models and db saving in the appropriate api file above (ie, jokes, stories, etc)
 */

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});


const SDXL_LIGHTNING_4STEP:`${string}/${string}:${string}` = "lucataco/sdxl-lightning-4step:727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a"

const SDXL:`${string}/${string}:${string}` = "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438"


const DEFAULT_NEGATIVE_PROMPT:string = "worst quality, low quality, bad quality, blurry";

const ARTISTIC_STYLE_PREFIX:string = "Concept art, art style, illustrative, painterly, matte painting, highly detailed, intricate details, immense details, soft colors"
const ARTISTIC_NEGATIVE_PROMPT:string = `
    blurry, bad quality, photo, photorealistic, realism, ugly, 
    easynegative 16-token-negative-deliberate-neg NegativeDynamics-neg negative_hand-neg boring artwork, 
    monochrome, watermarks,
`

export const generateImage = internalAction({
    args: {
        prompt: v.string(),
        negative_prompt: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
    },
    handler: async (_, args) => {

    console.log("running stable diffusion...");
    const output = await replicate.run(
        SDXL_LIGHTNING_4STEP,
        {
            input: {
                width: args.width || 1024,
                height: args.height || 1024,
                prompt: ARTISTIC_STYLE_PREFIX + ", " + args.prompt,
                scheduler: "K_EULER",
                num_outputs: 1,
                guidance_scale: 0,
                negative_prompt: args.negative_prompt || ARTISTIC_NEGATIVE_PROMPT,
                num_inference_steps: 4
            }
        }
        ) as [];
        console.log("output: ", output);
        return output.join("");
    }
});
