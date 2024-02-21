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
    embedding: v.optional(v.array(v.float64())),
    generatingTranscript: v.boolean(),
    generatingTitle: v.boolean(),
    generatingActionItems: v.boolean(),
  })
    .index('by_userId', ['userId'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 768,
      filterFields: ['userId'],
    }),
  actionItems: defineTable({
    storyId: v.id('stories'),
    userId: v.string(),
    task: v.string(),
  })
    .index('by_storyId', ['storyId'])
    .index('by_userId', ['userId']),
});
