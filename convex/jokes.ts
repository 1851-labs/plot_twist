import { ConvexError, v } from 'convex/values';
import { internal,api  } from './_generated/api';
import { internalAction, internalMutation, action } from './_generated/server';
import { 
    actionWithUser,
    mutationWithUser, 
    internalMutationWithUser 
} from './utils';

export const createJokeFromStory = action({
  args:{
    id: v.id('stories'),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const story = await ctx.runQuery(api.stories.getStory, { id });
    if (!story) {
        throw new ConvexError('Ooops, this story does not exist.');
    }
    if (story?.generatingTranscript) {
      throw new ConvexError('Ooops, the transcript is still being generated.');
    }
    const storyText = story.transcription || "error";
    
    /* 
     * We moved to together+mixtral because it was easier to get the Joke only
     * and there was no "Sure, here is a joke: " prefix or some similar suffix
     */
    const llama_joke = await ctx.runAction(
        internal.replicate.llama.llamaJoker, 
        {prompt: storyText},
    ) as string;

    const joke:string = await ctx.runAction(
        internal.together.mixtral.createJokeFromStory, 
        {story: storyText},
    ) as string;

    await ctx.runMutation(internal.jokes.saveJoke, { id, newJoke: joke });
  }
});

export const saveJoke = internalMutation({
  args:{
    id: v.id('stories'),
    newJoke: v.string(),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const story = await ctx.db.get(id);

    if (!story) {
        throw new ConvexError('Ooops, this story does not exist.');
    }

    if (story?.generatingTranscript) {
      throw new ConvexError('Ooops, the transcript is still being generated.');
    }

    await ctx.db.insert('jokes', {
        joke: args.newJoke,
        storyId: id,
        userId: story.userId,
        generatingJoke: false,
    });

    await ctx.db.patch(id, {
        generatingJoke: false,
    });

  },
});

export const removeJoke = mutationWithUser({
  args: {
    id: v.id('jokes'),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const existing = await ctx.db.get(id);
    if (existing) {
      if (existing.userId !== ctx.userId) {
        throw new ConvexError('Ooops, this is not your joke to delete.');
      }
      await ctx.db.delete(id);
    }
  },
});
