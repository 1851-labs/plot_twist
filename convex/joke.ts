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

    return {
      ...story,
      actionItems: actionItems,
    };
  },
});
