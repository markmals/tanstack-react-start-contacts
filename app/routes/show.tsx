import { href } from "#/lib/href.ts";
import { FavoriteSchema } from "#/lib/schemas.ts";
import { destroyContact, getContact, toggleFavorite } from "#/lib/server-fns.ts";
import * as s from "@remix-run/data-schema";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useActionState, useOptimistic } from "react";

export const Route = createFileRoute("/contact/$id")({
    async loader({ params }) {
        let contact = await getContact({ data: params.id });
        if (!contact) throw redirect({ statusCode: 404 });
        return contact;
    },
    component: ShowContact,
});

function ShowContact() {
    let contact = Route.useLoaderData();
    let hasAvatar = !!contact.avatar;

    let params = Route.useParams();
    let navigate = useNavigate();

    let [, destroyAction] = useActionState(
        async (_state: void, formData: FormData) => {
            if (!confirm("Please confirm you want to delete this record.")) {
                return;
            }

            await destroyContact({ data: formData });
        },
        undefined,
        destroyContact.url,
    );

    let [, editAction] = useActionState(
        () => navigate({ to: "/contact/$id/edit", params: { id: params.id } }),
        undefined,
        href({ to: "/contact/$id/edit", params: { id: params.id } }),
    );

    return (
        <div id="contact">
            <title>{`${contact.first} ${contact.last} | React Router Contacts`}</title>
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
                    <Favorite favorite={contact.favorite} id={params.id} />
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
                    <form action={editAction} method="get">
                        <button type="submit">Edit</button>
                    </form>
                    <form action={destroyAction} method="post">
                        <input name="id" type="hidden" value={params.id} />
                        <button type="submit">Delete</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Favorite(props: { favorite: boolean; id: string }) {
    let [favorited, setFavorite] = useOptimistic(props.favorite);
    let [, action] = useActionState(
        async (_state: void, formData: FormData) => {
            let { favorite } = s.parse(FavoriteSchema, formData);
            setFavorite(favorite);
            await toggleFavorite({ data: formData });
        },
        undefined,
        toggleFavorite.url,
    );

    return (
        <form action={action} method="post">
            <input name="id" type="hidden" value={props.id} />
            <button
                aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                name="favorite"
                type="submit"
                value={favorited ? "false" : "true"}
            >
                {favorited ? "★" : "☆"}
            </button>
        </form>
    );
}
