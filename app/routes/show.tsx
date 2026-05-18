import { useDestroyAction, useEditAction } from "#/lib/actions.ts";
import { getContactQuery } from "#/lib/queries.ts";
import { FavoriteSchema } from "#/lib/schemas.ts";
import { toggleFavorite } from "#/lib/server-fns.ts";
import * as s from "@remix-run/data-schema";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { use, useActionState, useOptimistic, useState } from "react";

export let Route = createFileRoute("/contact/$id")({
    async loader({ context: { queryClient }, params }) {
        let contact = await queryClient.ensureQueryData(getContactQuery(params.id));
        if (!contact) throw notFound();
    },
    component: ShowContact,
});

function ShowContact() {
    let params = Route.useParams();
    let { promise } = useQuery(getContactQuery(params.id));
    let contact = use(promise);
    if (!contact) throw notFound();

    let hasAvatar = Boolean(contact.avatar);
    let editAction = useEditAction(params.id);
    let destroyAction = useDestroyAction();

    return (
        <div id="contact">
            <title>{`${contact.first} ${contact.last} | TanStack Contacts`}</title>
            <div>
                <img
                    alt=""
                    key={contact.avatar}
                    src={
                        hasAvatar
                            ? (contact.avatar ?? undefined)
                            : "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
                    }
                />
            </div>

            <div>
                <h1>
                    {contact.first || contact.last ? (
                        <>
                            {contact.first} {contact.last}
                        </>
                    ) : (
                        <i>No Name</i>
                    )}{" "}
                    <Favorite favorite={contact.favorite} id={params.id} key={params.id} />
                </h1>

                {contact.bsky && (
                    <p>
                        <a
                            href={`https://bsky.app/profile/${contact.bsky}`}
                            rel="noreferrer"
                            target="_blank"
                        >
                            @{contact.bsky}
                        </a>
                    </p>
                )}

                {contact.notes && <p>{contact.notes}</p>}

                <div>
                    <form action={editAction}>
                        <button type="submit">Edit</button>
                    </form>
                    <form action={destroyAction} className="destroy-form">
                        <input name="id" type="hidden" value={params.id} />
                        <button type="submit">Delete</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Favorite(props: { favorite: boolean; id: string }) {
    let router = useRouter();
    // Local base, committed inside the action, prevents an optimistic-to-stale-prop flash on revalidate.
    let [committed, setCommitted] = useState(props.favorite);
    let [favorited, setFavorite] = useOptimistic(committed);
    let [, action] = useActionState(
        async (_state: void, formData: FormData) => {
            let { favorite } = s.parse(FavoriteSchema, formData);
            setFavorite(favorite);
            await toggleFavorite({ data: formData });
            setCommitted(favorite);
            await router.invalidate();
        },
        undefined,
        toggleFavorite.url,
    );

    return (
        <form action={action}>
            <input name="id" type="hidden" value={props.id} />
            <input name="favorite" type="hidden" value={favorited ? "false" : "true"} />
            <button
                aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                data-favorited={favorited}
                type="submit"
            >
                {favorited ? "★" : "☆"}
            </button>
        </form>
    );
}
