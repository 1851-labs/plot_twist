import { ConvexError, v } from 'convex/values';
import { internal, api } from './_generated/api';
import {
  internalAction,
  internalMutation,
  query,
  internalQuery,
  action,
} from './_generated/server';
import { 
  actionWithUser, 
  mutationWithUser, 
  queryWithUser 
} from './utils';
import { Id } from "./_generated/dataModel";


/*
 * Upload URL
 * ----------
 */
export const generateUploadUrl = mutationWithUser({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/*
 * Story
 * -----
 */
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
      generatingEmbellishment: true,
      generatingJoke: true,
    });

    await ctx.scheduler.runAfter(0, internal.stories.populateStoryFieldsOnBackend, {
      fileUrl,
      id: storyId,
    });

    return storyId;
  },
});

/* 
 * Populates story fields on the backend by calling various AI apis
 */
export const populateStoryFieldsOnBackend = internalAction({
  args: {
    fileUrl: v.string(),
    id: v.id('stories'),
  },
  handler: async (ctx, args) => {
    const fileUrl = args.fileUrl;
    const storyId = args.id;

    // First generate the transcript of the voice recording...
    const transcript:string = await ctx.runAction(
      internal.stories.createAndSaveTranscript, 
      { fileUrl, id: storyId }
    );

    // The following are kicked off in parallel and run when ever they are ready...

    // Create & save a joke from the story's transcript
    await ctx.scheduler.runAfter(
      0, api.jokes.createJokeFromStory, 
      { id: storyId }
    );

    // Create and save the summary and title from the transcript
    await ctx.scheduler.runAfter(
      0, internal.stories.createAndSaveSummary, 
      { id: storyId, transcript }
    );

    // Create and save the details of the story
    await ctx.scheduler.runAfter(
      0, internal.stories.createAndSaveStoryDetails, 
      { id: storyId, transcript }
    );

    // Create and save an embedding of the transcript
    await ctx.scheduler.runAfter(
      0, internal.stories.createAndSaveEmbedding, 
      { id: storyId, transcript: transcript }
    );

    // Create and save an image from the transcript
    await ctx.scheduler.runAfter(
      0, api.stories.createAndSaveImage, 
      { id: storyId }
    );

  }
});


export const getStory = query({
  args: {
    id: v.optional(v.id('stories')),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    if (!id) return null;
    const story = await ctx.db.get(id);
    if (!story) {
      throw new ConvexError('Story not found.');
    }

    const jokes = await ctx.db
      .query('jokes')
      .withIndex('by_storyId', (q) => q.eq('storyId', story._id))
      .collect();

    const images = await ctx.db
      .query('image')
      .withIndex('by_storyId', (q) => q.eq('storyId', story._id))
      .collect();

    return {
      ...story,
      actionItems: [],
      jokes: jokes,
      images: images,
    };
  },
});

export const getStories = queryWithUser({
  args: {},
  handler: async (ctx, _) => {
    const userId = ctx.userId;
    if (userId === undefined) {
      return null;
    }
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
      // NB: Removing story does *not* remove jokes or anything else.
    }
  },
});

export const jokeCountForStory = queryWithUser({
  args: {
    storyId: v.id('stories'),
  },
  handler: async (ctx, args) => {
    const { storyId } = args;
    const jokes = await ctx.db
      .query('jokes')
      .withIndex('by_storyId', (q) => q.eq('storyId', storyId))
      .collect();
    for (const ai of jokes) {
      if (ai.userId !== ctx.userId) {
        throw new ConvexError('Ooops, this is not your story to count jokes for.');
      }
    }
    return jokes.length;
  },
});

/*
 * Story.transcription
 * -----
 */
export const createAndSaveTranscript = internalAction({
  args: {
    fileUrl: v.string(),
    id: v.id('stories'),
  },
  handler: async (ctx, args) => {
    const replicateOutput = (await ctx.runAction(
      internal.replicate.whisper.getTranscription,
      { fileUrl: args.fileUrl, id: args.id }
    )) as string;
    await ctx.runMutation(internal.stories.saveTranscript, {
      id: args.id,
      transcript: replicateOutput,
    });
    return replicateOutput;
  },
});

export const saveTranscript = internalMutation({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, transcript } = args;

    await ctx.db.patch(id, {
      transcription: transcript,
      generatingTranscript: false,
    });

  },
});

export const getTranscript = internalQuery({
  args: {
    id: v.id('stories'),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const story = await ctx.db.get(id);
    return story?.transcription;
  },
});

/*
 * Story.embellishment
 * -----
 */

export const saveEmbellishment = internalMutation({
  args: {
    id: v.id('stories'),
    embellishment: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, embellishment } = args;
    await ctx.db.patch(id, {
      embellishment: embellishment,
      generatingEmbellishment: false,
    });
  },
});

/*
 * Story.image
 * -----
 */
export const createAndSaveImage = action({
  args: {
    id: v.id('stories'),
  },
  handler: async (ctx, args) => {
    const story = await ctx.runQuery(api.stories.getStory, { id: args.id });
    if (!story) {
      throw new ConvexError('Ooops, this story does not exist.');
    }

    // llama2 was too hard to control and had so many extra chat prefix and suffix to its answers

    /*
    console.log("create and save image...");
    const embellishedStory = await ctx.runAction(
      internal.replicate.llama.llamaStoryEmbellisher, 
      { prompt: story.transcription || "error" }
    );
    console.log("embellishedStory: ", embellishedStory);
    ctx.runMutation(internal.stories.saveEmbellishment, 
      { id:args.id, embellishment:embellishedStory }
    );
    */

    /*
    const imageDescription = await ctx.runAction(
      internal.replicate.mixtral.mixtralImageDescription,
      {story: story.transcription || "error"},
    );
    */

    /*
    const imageDescription = await ctx.runAction(
      internal.replicate.llama.llamaIllistrator, 
      { prompt: embellishedStory }
    );
    console.log("imageDescription: ", imageDescription);
    */



    /*
    console.log("Calling extractProtagonistAndSetting...")
    const extract = await ctx.runAction(
      internal.together.mixtral.extractProtagonistAndSetting,
      { id: args.id, transcript: story.transcription || "error" }
    );
    */

    //console.log(extract);

    const imageDescription = await ctx.runAction(
      internal.together.mixtral.createImageDescStory, 
      { story: story.transcription || "error" }
    );

    console.log("imageDescription: ", imageDescription);

    const imageUrl = await ctx.runAction(
      internal.replicate.stable_diffusion.generateImage,
      { prompt: imageDescription, height: 512, width: 512 },
    );
    console.log("image url: ", imageUrl);

    // Download the image
    const response = await fetch(imageUrl);
    console.log("image downloaded...");
    const image = await response.blob();

    console.log("storying image in file storage...");
    // Store the image in Convex
    const imageStorageId: Id<"_storage"> = await ctx.storage.store(image);

    console.log("imageStorageId: ", imageStorageId);

    console.log("Saving image into database...");
    await ctx.runMutation(internal.stories.saveImage, {
      userId: story.userId,
      storyId: args.id,
      imageDescription: imageDescription,
      imageFileId: imageStorageId,
      imageFileUrl: imageUrl,
    });

    console.log("image saved...");
  },
});

export const saveStoryEmbellishment = internalMutation({
  args: {
    id: v.id('stories'),
    embellishment: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, embellishment } = args;
    await ctx.db.patch(id, {
      embellishment: embellishment,
      generatingEmbellishment: false,
    });
  },
});


export const saveImage = internalMutation({
  args: {
    userId: v.string(),
    storyId: v.id('stories'),
    imageDescription  : v.string(),
    imageFileId: v.id('_storage'),
    imageFileUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('image', {
      userId: args.userId,
      storyId: args.storyId,

      imageDescription: args.imageDescription,

      imageFileId: args.imageFileId,
      imageFileUrl: args.imageFileUrl,
    });
  },
});

/*
 * Story.summary
 * -----
 */
export const createAndSaveSummary = internalAction({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    const { transcript } = args;

    try {
      const extract = await ctx.runAction(internal.together.mixtral.summarizeTranscript,
        { transcript: transcript, id: args.id });
      await ctx.runMutation(internal.stories.saveSummary, {
        id: args.id,
        summary: extract.summary,
        title: extract.title,
      });
    } catch (e) {
      console.error('Error summarizing transcript through mixtral on together.ai', e);
      await ctx.runMutation(internal.stories.saveSummary, {
        id: args.id,
        summary: 'Summary failed to generate',
        title: transcript.substring(0, 50),
      });
    }
  },
});

export const saveSummary = internalMutation({
  args: {
    id: v.id('stories'),
    summary: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, summary, title } = args;
    await ctx.db.patch(id, {
      summary: summary,
      title: title,
      generatingTitle: false,
    });

    let story = await ctx.db.get(id);

    if (!story) {
      console.error(`Couldn't find story ${id}`);
      return;
    }
  },
});

/*
 * Story details (protagonist, setting, conflict)
 * -----
 */
export const createAndSaveStoryDetails = internalAction({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    const { transcript } = args;

    try {
      const extract = await ctx.runAction(internal.together.mixtral.extractStoryDetails,
        { transcript: transcript, id: args.id });
      await ctx.runMutation(internal.stories.saveDetails, {
        id: args.id,
        protagonist: extract.protagonist,
        setting: extract.setting,
        conflict: extract.conflict,
      });
    } catch (e) {
      console.error('Error summarizing transcript through mixtral on together.ai', e);
      await ctx.runMutation(internal.stories.saveSummary, {
        id: args.id,
        summary: 'Summary failed to generate',
        title: transcript.substring(0, 50),
      });
    }
  },
});

export const saveDetails = internalMutation({
  args: {
    id: v.id('stories'),
    protagonist: v.string(),
    setting: v.string(),
    conflict: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, protagonist, setting, conflict } = args;
    await ctx.db.patch(id, {
      protagonist: protagonist,
      setting: setting,
      conflict: conflict,
    });

    let story = await ctx.db.get(id);

    if (!story) {
      console.error(`Couldn't find story ${id}`);
      return;
    }
  },
});

/*
 * Story.embedding
 * -----
 */
export type SearchResult = {
  id: string;
  score: number;
};

export const findSimilarStories = actionWithUser({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args): Promise<SearchResult[]> => {
    console.log("find simialr stories...");
    // 1. First get the embedding of the search query
    const embedding = await ctx.runAction(
      internal.together.bert.getEmbedding, 
      { str: args.searchQuery}
    );

    // 2. Then search for similar stories
    const results = await ctx.vectorSearch('stories', 'by_embedding', {
      vector: embedding,
      limit: 16,
      filter: (q) => q.eq('userId', ctx.userId), // Only search my stories.
    });

    return results.map((r) => ({
      id: r._id,
      score: r._score,
    }));
  },
});
export const createAndSaveEmbedding = internalAction({
  args: {
    id: v.id('stories'),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    const embedding = await ctx.runAction(
      internal.together.bert.getEmbedding, 
      { str: args.transcript }
    );
    await ctx.runMutation(internal.stories.saveEmbedding, {
      id: args.id,
      embedding,
    });
  },
});

export const saveEmbedding = internalMutation({
  args: {
    id: v.id('stories'),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const { id, embedding } = args;
    await ctx.db.patch(id, {
      embedding: embedding,
    });
  },
});
