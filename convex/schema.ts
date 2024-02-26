import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  stories: defineTable({
    userId: v.string(),

    audioFileId: v.string(),
    audioFileUrl: v.string(),

    title: v.optional(v.string()),
    transcription: v.optional(v.string()),
    summary: v.optional(v.string()),
    embellishment: v.optional(v.string()),
    imageDescription: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),

    generatingTranscript: v.boolean(),
    generatingEmbellishment: v.optional(v.boolean()),
    generatingImageDescription: v.optional(v.boolean()),
    generatingTitle: v.boolean(),
    generatingActionItems: v.boolean(), // deprecated
    generatingJoke:v.optional(v.boolean()),
  })
    .index('by_userId', ['userId'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 768,
      filterFields: ['userId'],
    }),

  // `actionItems` are deprecated
  actionItems: defineTable({
    userId: v.string(),
    storyId: v.id('stories'),

    task: v.string(),
  })
    .index('by_storyId', ['storyId'])
    .index('by_userId', ['userId']),

 jokes: defineTable({
    userId: v.string(),
    storyId: v.id('stories'),

    joke: v.string(),
    embedding: v.optional(v.array(v.float64())),
    generatingJoke: v.boolean(),
  })
    .index('by_storyId', ['storyId'])
    .index('by_userId', ['userId']),

  image: defineTable({
    userId: v.string(),
    storyId: v.id('stories'),

    imageDescription: v.optional(v.string()),
    generatingImageDescription: v.boolean(),

    imageFileId: v.optional(v.string()),
    imageFileUrl: v.optional(v.string()),
    generatingImageFile: v.boolean(),
    
  })
    .index('by_userId', ['userId'])
    .index('by_storyId', ['storyId']),

});
