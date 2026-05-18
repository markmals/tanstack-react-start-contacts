import { Contacts, type Contact } from "#db/schema.ts";
import * as schema from "#db/schema.ts";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { sortBy } from "es-toolkit/array";
import { matchSorter } from "match-sorter";
import { setTimeout as sleep } from "node:timers/promises";

const AT_PATTERN = /^@+/;
const FAKE_NETWORK_CACHE_LIMIT = 200;

export class ContactsRepo {
    // Bounded FIFO cache: tracks which keys have already paid the fake-network tax
    // so repeated dev-mode requests stay snappy. Sets preserve insertion order, so
    // evicting the first element drops the oldest entry.
    #cache = new Set<string>();
    #db = drizzle(env.DB, { schema });

    async show(id?: number): Promise<Contact | null> {
        if (!id) return null;
        await this.#fakeNetwork(`show:${id}`);
        let [contact] = await this.#db.select().from(Contacts).where(eq(Contacts.id, id));
        return contact ?? null;
    }

    async list(query?: string): Promise<Contact[]> {
        await this.#fakeNetwork(`list:${query}`);

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

    async update(id: number, updates: Partial<Contact>): Promise<Contact | null> {
        await this.#fakeNetwork();

        let { id: _id, createdAt: _createdAt, ...patch } = updates;

        if (typeof patch.bsky === "string") {
            patch.bsky = patch.bsky.replace(AT_PATTERN, "");
        }

        if (Object.keys(patch).length === 0) {
            let [existing] = await this.#db.select().from(Contacts).where(eq(Contacts.id, id));
            return existing ?? null;
        }

        let [updated] = await this.#db
            .update(Contacts)
            .set(patch)
            .where(eq(Contacts.id, id))
            .returning();
        return updated ?? null;
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

        if (key && this.#cache.has(key)) return;

        if (key) {
            if (this.#cache.size >= FAKE_NETWORK_CACHE_LIMIT) {
                let oldest = this.#cache.values().next().value;
                if (oldest !== undefined) this.#cache.delete(oldest);
            }
            this.#cache.add(key);
        }

        // Fake network slowdown between 1-3 seconds
        await sleep(1000 + Math.random() * 2_000);
    }
}

export let db = {
    contacts: new ContactsRepo(),
};
