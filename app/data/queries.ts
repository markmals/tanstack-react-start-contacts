import type { Id } from "#convex/_generated/dataModel.js";

import { api } from "#convex/_generated/api.js";
import { convexQuery } from "@convex-dev/react-query";

export function getContactQuery(id: string) {
    return convexQuery(api.contacts.get, { id: id as Id<"contacts"> });
}

export function listContactsQuery(q?: string) {
    return convexQuery(api.contacts.list, { q });
}
