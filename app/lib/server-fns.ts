import * as s from "@remix-run/data-schema";
import * as coerce from "@remix-run/data-schema/coerce";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { db } from "./contacts.ts";
import { FavoriteSchema, IdSchema, QuerySchema, UpdateSchema, fromInput } from "./schemas.ts";

export let getContacts = createServerFn({ method: "GET" }).handler(async () => {
    let request = getRequest();
    let url = new URL(request.url);
    let { q: query } = s.parse(QuerySchema, url.searchParams);
    let contacts = await db.contacts.list(query);
    return { contacts, query };
});

export let createContact = createServerFn({ method: "POST" }).handler(async () => {
    let id = await db.contacts.create();
    throw redirect({ to: "/contact/$id/edit", params: { id: String(id) } });
});

export let getContact = createServerFn({ method: "GET" })
    .inputValidator(fromInput<string>()(coerce.number()))
    .handler(({ data: id }) => db.contacts.show(id));

export let toggleFavorite = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(FavoriteSchema))
    .handler(({ data }) => {
        db.contacts.update(data.id, { favorite: data.favorite });
    });

export let destroyContact = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(IdSchema))
    .handler(async ({ data }) => {
        await db.contacts.destroy(data.id);
        throw redirect({ to: "/" });
    });

export let editContact = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(UpdateSchema))
    .handler(({ data }) => {
        db.contacts.update(data.id, data);
    });
