import { sql } from "drizzle-orm";
import { integer, sqliteTable as table, text } from "drizzle-orm/sqlite-core";

export let Contacts = table("contacts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    first: text("first").notNull(),
    last: text("last").notNull(),
    avatar: text("avatar"),
    bsky: text("bsky").notNull(),
    notes: text("notes").notNull(),
    favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
    createdAt: text("createdAt")
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});

export type Contact = typeof Contacts.$inferSelect;
export type CreateContact = typeof Contacts.$inferInsert;
