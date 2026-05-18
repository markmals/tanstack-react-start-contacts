import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    contacts: defineTable({
        first: v.string(),
        last: v.string(),
        avatar: v.optional(v.string()),
        bsky: v.string(),
        notes: v.string(),
        favorite: v.boolean(),
    }),
});
