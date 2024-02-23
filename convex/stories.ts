import { ConvexError, v } from 'convex/values';
import { internal } from './_generated/api';
import { mutationWithUser, queryWithUser } from './utils';

export const generateUploadUrl = mutationWithUser({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createJoke = mutationWithUser({
  args:{
    id: v.id('stories')
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const story = await ctx.db.get(id);
    if (story?.userId !== ctx.userId) {
      throw new ConvexError('Ooops, This is not your story.');
    }

    if (story?.generatingTranscript) {
      throw new ConvexError('Ooops, the transcript is still being generated.');
    }

    await ctx.scheduler.runAfter(0, internal.replicate_joke.chat, {
      id: id,
      prompt: story.transcription || "error",
    });
  },
});

export const createStory = mutationWithUser({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { storageId }) => {
    const userId = ctx.userId;
    let fileUrl = (await ctx.storage.getUrl(storageId)) as string;

    const storyId = await ctx.db.insert('stories', {
      userId,
      audioFileId: storageId,
      audioFileUrl: fileUrl,
      generatingTranscript: true,
      generatingTitle: true,
      generatingActionItems: true,
    });

    await ctx.scheduler.runAfter(0, internal.whisper.chat, {
      fileUrl,
      id: storyId,
    });

    return storyId;
  },
});

export const getStory = queryWithUser({
  args: {
    id: v.optional(v.id('stories')),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    if (!id) return null;
    const story = await ctx.db.get(id);
    if (story?.userId !== ctx.userId) {
      throw new ConvexError('Not your story.');
    }

    const actionItems = await ctx.db
      .query('actionItems')
      .withIndex('by_storyId', (q) => q.eq('storyId', story._id))
      .collect();
    
    const jokes = await ctx.db
      .query('jokes')
      .withIndex('by_storyId', (q) => q.eq('storyId', story._id))
      .collect();

    return {
      ...story,
      actionItems: actionItems,
      jokes: jokes,
    };
  },
});

export const getActionItems = queryWithUser({
  args: {},
  handler: async (ctx, args) => {
    const userId = ctx.userId;

    const actionItems = await ctx.db
      .query('actionItems')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();

    let fullActionItems = [];

    for (let item of actionItems) {
      const story = await ctx.db.get(item.storyId);
      if (!story) continue;
      fullActionItems.push({
        ...item,
        title: story.title,
      });
    }

    return fullActionItems;
  },
});

export const getStories = queryWithUser({
  args: {},
  handler: async (ctx, args) => {
    const userId = ctx.userId;
    const stories = await ctx.db
      .query('stories')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect();

    const results = Promise.all(
      stories.map(async (story) => {
        const count = (
          await ctx.db
            .query('jokes')
            .withIndex('by_storyId', (q) => q.eq('storyId', story._id))
            .collect()
        ).length;
        return {
          count,
          ...story,
        };
      }),
    );

    return results;
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

export const removeActionItem = mutationWithUser({
  args: {
    id: v.id('actionItems'),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const existing = await ctx.db.get(id);
    if (existing) {
      if (existing.userId !== ctx.userId) {
        throw new ConvexError('Not your action item');
      }
      await ctx.db.delete(id);
    }
  },
});

export const removeStory = mutationWithUser({
  args: {
    id: v.id('stories'),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const existing = await ctx.db.get(id);
    if (existing) {
      if (existing.userId !== ctx.userId) {
        throw new ConvexError('Not your story');
      }
      await ctx.db.delete(id);
      // NB: Removing story does *not* remove action items.
    }
  },
});

export const jokeCountForStory = queryWithUser({
  args: {
    storyId: v.id('stories'),
  },
  handler: async (ctx, args) => {
    const { storyId } = args;
    const actionItems = await ctx.db
      .query('jokes')
      .withIndex('by_storyId', (q) => q.eq('storyId', storyId))
      .collect();
    for (const ai of actionItems) {
      if (ai.userId !== ctx.userId) {
        throw new ConvexError('Ooops, this is not your story to count jokes for.');
      }
    }
    return actionItems.length;
  },
});
