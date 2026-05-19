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
            <p className="m-0 flex p-0">
                <span className="w-32">Name</span>
                <input
                    aria-label="First name"
                    className="mr-4 grow-2"
                    defaultValue={contact.first}
                    name="first"
                    placeholder="First"
                    type="text"
                />
                <input
                    aria-label="Last name"
                    className="grow-2"
                    defaultValue={contact.last}
                    name="last"
                    placeholder="Last"
                    type="text"
                />
            </p>
            <label className="flex">
                <span className="w-32">Bluesky</span>
                <input
                    className="grow-2"
                    defaultValue={contact.bsky}
                    name="bsky"
                    pattern="@?[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z0-9][a-zA-Z0-9.\-]*"
                    placeholder="jay.bsky.team"
                    title="A Bluesky handle like jay.bsky.team"
                    type="text"
                />
            </label>
            <label className="flex">
                <span className="w-32">Avatar URL</span>
                <input
                    aria-label="Avatar URL"
                    className="grow-2"
                    defaultValue={contact.avatar ?? undefined}
                    name="avatar"
                    placeholder="https://example.com/avatar.jpg"
                    type="url"
                />
            </label>
            <label className="flex">
                <span className="w-32">Notes</span>
                <textarea
                    className="grow-2"
                    defaultValue={contact.notes}
                    name="notes"
                    rows={6}
                />
            </label>
            <p className="m-0 ml-32 flex gap-2">
                <button type="submit">Save</button>
                <CancelButton id={params.id} />
            </p>
        </EditContactForm>
    );
}
