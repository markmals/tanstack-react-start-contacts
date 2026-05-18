import * as coerce from "@remix-run/data-schema/coerce";
import { notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { db } from "./contacts.ts";
import { FavoriteSchema, IdSchema, QuerySchema, UpdateSchema, fromInput } from "./schemas.ts";

export let getContacts = createServerFn({ method: "GET" })
    .inputValidator(fromInput<{ q?: string }>()(QuerySchema))
    .handler(({ data }) => db.contacts.list(data.q));

export let createContact = createServerFn({ method: "POST" }).handler(async () => {
    let id = await db.contacts.createEmpty();
    throw redirect({ to: "/contact/$id/edit", params: { id: String(id) } });
});

export let getContact = createServerFn({ method: "GET" })
    .inputValidator(fromInput<string>()(coerce.number()))
    .handler(({ data: id }) => db.contacts.show(id));

export let toggleFavorite = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(FavoriteSchema))
    .handler(async ({ data }) => {
        let updated = await db.contacts.update(data.id, { favorite: data.favorite });
        if (!updated) throw notFound();
    });

export let destroyContact = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(IdSchema))
    .handler(async ({ data }) => {
        await db.contacts.destroy(data.id);
        throw redirect({ to: "/" });
    });

export let editContact = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(UpdateSchema))
    .handler(async ({ data }) => {
        let updated = await db.contacts.update(data.id, data);
        if (!updated) throw notFound();
        throw redirect({ to: "/contact/$id", params: { id: String(data.id) } });
    });
