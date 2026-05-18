import { CancelButton } from "#/components/buttons.tsx";
import { EditContactForm } from "#/components/forms.tsx";
import { getContactQuery } from "#/data/queries.ts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

export let Route = createFileRoute("/contact/$id/edit")({
    loader: {
        handler: async ({ context: { queryClient }, params }) => {
            let contact = await queryClient.ensureQueryData(getContactQuery(params.id));
            if (!contact) throw notFound();
        },
        staleReloadMode: "blocking",
    },
    component: EditContact,
});

function EditContact() {
    let params = Route.useParams();
    let { data: contact } = useSuspenseQuery(getContactQuery(params.id));
    if (!contact) throw notFound();

    return (
        <EditContactForm id="contact-form">
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
                <CancelButton id={params.id} />
            </p>
        </EditContactForm>
    );
}
