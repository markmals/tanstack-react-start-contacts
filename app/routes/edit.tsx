import { editContact, getContact } from "#/lib/server-fns.ts";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useActionState } from "react";

export const Route = createFileRoute("/contact/$id/edit")({
    async loader({ params }) {
        let contact = await getContact({ data: params.id });
        if (!contact) throw redirect({ statusCode: 404 });
        return contact;
    },
    component: RouteComponent,
});

function RouteComponent() {
    let contact = Route.useLoaderData();
    let router = useRouter();

    let [, editAction] = useActionState(
        (_state: void, data: FormData) => editContact({ data }),
        undefined,
        editContact.url,
    );

    return (
        <form action={editAction} id="contact-form" method="post">
            <title>{`Editing ${contact.first} ${contact.last} | TanStack Contacts`}</title>
            <p>
                <span>Name</span>
                <input
                    aria-label="First name"
                    defaultValue={contact.first ?? undefined}
                    name="first"
                    placeholder="First"
                    type="text"
                />
                <input
                    aria-label="Last name"
                    defaultValue={contact.last ?? undefined}
                    name="last"
                    placeholder="Last"
                    type="text"
                />
            </p>
            <label>
                <span>Bluesky</span>
                <input
                    defaultValue={contact.bsky ?? undefined}
                    name="bsky"
                    placeholder="jay.bsky.team"
                    type="text"
                />
            </label>
            <label>
                <span>Avatar URL</span>
                <input
                    aria-label="Avatar URL"
                    defaultValue={contact.avatar ?? undefined}
                    name="avatar"
                    placeholder="https://example.com/avatar.jpg"
                    type="text"
                />
            </label>
            <label>
                <span>Notes</span>
                <textarea defaultValue={contact.notes ?? undefined} name="notes" rows={6} />
            </label>
            <p>
                <button type="submit">Save</button>
                <button onClick={() => router.history.back()} type="button">
                    Cancel
                </button>
            </p>
        </form>
    );
}
