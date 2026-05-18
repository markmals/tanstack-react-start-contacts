import { Contacts, type Contact } from "#db/schema.ts";
import * as schema from "#db/schema.ts";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { sortBy } from "es-toolkit/array";
import { matchSorter } from "match-sorter";
import assert from "node:assert";
import { setTimeout as sleep } from "node:timers/promises";

const AT_PATTERN = /^@+/;

export class ContactsRepo {
    // fake a cache so we don't slow down stuff we've already seen
    #cache = new Map<string, boolean>();
    #db = drizzle(env.DB, { schema });

    async show(id?: number): Promise<Contact | null> {
        if (!id) return null;
        await this.#fakeNetwork(`contact:${id}`);
        let [contact] = await this.#db.select().from(Contacts).where(eq(Contacts.id, id));
        return contact ?? null;
    }

    async list(query?: string): Promise<Contact[]> {
        await this.#fakeNetwork(`getContacts:${query}`);

        let rows = await this.#db.select().from(Contacts);

        if (query) {
            rows = matchSorter(rows, query, { keys: ["first", "last"] });
        }

        return sortBy(rows, ["last", "createdAt"]);
    }

    async create(): Promise<number> {
        let [contact] = await this.#db
            .insert(Contacts)
            .values({ first: "", last: "", bsky: "", notes: "" })
            .returning();

        return contact.id;
    }

    async update(id: number, updates: Partial<Contact>) {
        await this.#fakeNetwork();

        let [existing] = await this.#db.select().from(Contacts).where(eq(Contacts.id, id));
        assert(existing, `Contact with id ${id} not found`);

        let { id: _id, createdAt: _createdAt, ...patch } = updates;
        if (Object.keys(patch).length === 0) return existing;

        if (typeof patch.bsky === "string") {
            patch.bsky = patch.bsky.replace(AT_PATTERN, "");
        }

        let [updated] = await this.#db
            .update(Contacts)
            .set(patch)
            .where(eq(Contacts.id, id))
            .returning();
        return updated;
    }

    async destroy(id: number): Promise<boolean> {
        let result = await this.#db
            .delete(Contacts)
            .where(eq(Contacts.id, id))
            .returning({ id: Contacts.id });
        return result.length > 0;
    }

    async #fakeNetwork(key?: string) {
        if (process.env.NODE_ENV === "test") {
            return;
        }

        if (!key || !this.#cache.get(key)) {
            if (key) this.#cache.set(key, true);
            // Fake network slowdown between 1-3 seconds
            return await sleep(1000 + Math.random() * 2_000);
        }
    }
}

export let db = {
    contacts: new ContactsRepo(),
};
