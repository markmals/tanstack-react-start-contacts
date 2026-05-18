import { editContact, getContact } from "#/lib/server-fns.ts";
import {
    createFileRoute,
    notFound,
    useCanGoBack,
    useNavigate,
    useRouter,
} from "@tanstack/react-router";
import { useActionState } from "react";

export let Route = createFileRoute("/contact/$id/edit")({
    async loader({ params }) {
        let contact = await getContact({ data: params.id });
        if (!contact) throw notFound();
        return contact;
    },
    component: RouteComponent,
});

function RouteComponent() {
    let contact = Route.useLoaderData();
    let router = useRouter();
    let navigate = useNavigate();
    let canGoBack = useCanGoBack();
    let params = Route.useParams();

    let [, editAction] = useActionState(
        (_state: void, data: FormData) => editContact({ data }),
        undefined,
        editContact.url,
    );

    function handleCancel() {
        if (canGoBack) {
            router.history.back();
        } else {
            navigate({ to: "/contact/$id", params });
        }
    }

    return (
        <form action={editAction} id="contact-form" method="post">
            <title>{`Editing ${contact.first} ${contact.last} | TanStack Contacts`}</title>
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
