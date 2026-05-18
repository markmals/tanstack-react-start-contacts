import { useCancelHandler, useUpdateAction } from "#/lib/hooks.ts";
import { getContact } from "#/lib/server-fns.ts";
import { createFileRoute, notFound } from "@tanstack/react-router";

export let Route = createFileRoute("/contact/$id/edit")({
    async loader({ params }) {
        let contact = await getContact({ data: params.id });
        if (!contact) throw notFound();
        return contact;
    },
    component: EditContact,
});

function EditContact() {
    let contact = Route.useLoaderData();
    let params = Route.useParams();

    let updateAction = useUpdateAction();
    let handleCancel = useCancelHandler(params.id);

    return (
        <form action={updateAction} id="contact-form">
            <title>{`Editing ${contact.first} ${contact.last} | TanStack Contacts`}</title>
            <input name="id" type="hidden" value={params.id} />
            <p>
                <span>Name</span>
                <input
                    aria-label="First name"
                    defaultValue={contact.first}
                    name="first"
                    placeholder="First"
                    type="text"
                />
                <input
                    aria-label="Last name"
                    defaultValue={contact.last}
                    name="last"
                    placeholder="Last"
                    type="text"
                />
            </p>
            <label>
                <span>Bluesky</span>
                <input
                    defaultValue={contact.bsky}
                    name="bsky"
                    pattern="@?[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z0-9][a-zA-Z0-9.\-]*"
                    placeholder="jay.bsky.team"
                    title="A Bluesky handle like jay.bsky.team"
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
                    type="url"
                />
            </label>
            <label>
                <span>Notes</span>
                <textarea defaultValue={contact.notes} name="notes" rows={6} />
            </label>
            <p>
                <button type="submit">Save</button>
                <button onClick={handleCancel} type="button">
                    Cancel
                </button>
            </p>
        </form>
    );
}
