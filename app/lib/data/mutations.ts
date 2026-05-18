import type { Id } from "#convex/_generated/dataModel.js";

import { api } from "#convex/_generated/api.js";
import { notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { FavoriteSchema, IdSchema, UpdateSchema, fromInput } from "../schemas.ts";
import { createConvexHttpClient } from "./convex.ts";

function contactId(value: string): Id<"contacts"> {
    return value as Id<"contacts">;
}

export let createContact = createServerFn({ method: "POST" }).handler(async () => {
    let convex = createConvexHttpClient();
    let id = await convex.mutation(api.contacts.createEmpty, {});
    throw redirect({ to: "/contact/$id/edit", params: { id } });
});

export let toggleFavorite = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(FavoriteSchema))
    .handler(async ({ data }) => {
        let convex = createConvexHttpClient();
        let updated = await convex.mutation(api.contacts.update, {
            id: contactId(data.id),
            favorite: data.favorite,
        });
        if (!updated) throw notFound();
        throw redirect({ to: "/contact/$id", params: { id: updated._id } });
    });

export let destroyContact = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(IdSchema))
    .handler(async ({ data }) => {
        let convex = createConvexHttpClient();
        await convex.mutation(api.contacts.destroy, { id: contactId(data.id) });
        throw redirect({ to: "/" });
    });

export let updateContact = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(UpdateSchema))
    .handler(async ({ data }) => {
        let convex = createConvexHttpClient();
        let updated = await convex.mutation(api.contacts.update, {
            id: contactId(data.id),
            first: data.first,
            last: data.last,
            avatar: data.avatar,
            bsky: data.bsky,
            notes: data.notes,
        });
        if (!updated) throw notFound();
        throw redirect({ to: "/contact/$id", params: { id: data.id } });
    });
