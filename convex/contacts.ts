import { v } from "convex/values";
import { sortBy } from "es-toolkit/array";
import { matchSorter } from "match-sorter";

import { mutation, query } from "./_generated/server.js";

const AT_PATTERN = /^@+/;

export let list = query({
    args: { q: v.optional(v.string()) },
    handler: async (ctx, { q }) => {
        let rows = await ctx.db.query("contacts").collect();
        if (q) {
            rows = matchSorter(rows, q, { keys: ["first", "last"] });
        }
        return sortBy(rows, ["last", "_creationTime"]);
    },
});

export let get = query({
    args: { id: v.id("contacts") },
    handler: (ctx, { id }) => ctx.db.get(id),
});

export let count = query({
    args: {},
    handler: async ctx => {
        let rows = await ctx.db.query("contacts").collect();
        return rows.length;
    },
});

export let createEmpty = mutation({
    args: {},
    handler: ctx =>
        ctx.db.insert("contacts", {
            first: "",
            last: "",
            bsky: "",
            notes: "",
            favorite: false,
        }),
});

export let create = mutation({
    args: {
        first: v.string(),
        last: v.string(),
        avatar: v.optional(v.string()),
        bsky: v.string(),
        notes: v.string(),
        favorite: v.optional(v.boolean()),
    },
    handler: (ctx, values) =>
        ctx.db.insert("contacts", {
            first: values.first,
            last: values.last,
            avatar: values.avatar,
            bsky: values.bsky,
            notes: values.notes,
            favorite: values.favorite ?? false,
        }),
});

export let update = mutation({
    args: {
        id: v.id("contacts"),
        first: v.optional(v.string()),
        last: v.optional(v.string()),
        avatar: v.optional(v.string()),
        bsky: v.optional(v.string()),
        notes: v.optional(v.string()),
        favorite: v.optional(v.boolean()),
    },
    handler: async (ctx, { id, first, last, avatar, bsky, notes, favorite }) => {
        let existing = await ctx.db.get(id);
        if (!existing) return null;

        let patch: {
            first?: string;
            last?: string;
            avatar?: string;
            bsky?: string;
            notes?: string;
            favorite?: boolean;
        } = {};
        if (first !== undefined) patch.first = first;
        if (last !== undefined) patch.last = last;
        if (avatar !== undefined) patch.avatar = avatar;
        if (bsky !== undefined) patch.bsky = bsky.replace(AT_PATTERN, "");
        if (notes !== undefined) patch.notes = notes;
        if (favorite !== undefined) patch.favorite = favorite;

        if (Object.keys(patch).length === 0) return existing;

        await ctx.db.patch(id, patch);
        return ctx.db.get(id);
    },
});

export let destroy = mutation({
    args: { id: v.id("contacts") },
    handler: async (ctx, { id }) => {
        let existing = await ctx.db.get(id);
        if (!existing) return false;
        await ctx.db.delete(id);
        return true;
    },
});

export let seed = mutation({
    args: {
        contacts: v.array(
            v.object({
                first: v.string(),
                last: v.string(),
                avatar: v.optional(v.string()),
                bsky: v.string(),
                notes: v.string(),
            }),
        ),
    },
    handler: async (ctx, { contacts }) => {
        let existing = await ctx.db.query("contacts").take(1);
        if (existing.length > 0) return 0;

        for (let contact of contacts) {
            await ctx.db.insert("contacts", { ...contact, favorite: false });
        }
        return contacts.length;
    },
});
