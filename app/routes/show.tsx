import { useDestroyForm, useEditForm, useFavoriteForm } from "#/lib/forms.ts";
import { getContactQuery } from "#/lib/queries.ts";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { use } from "react";

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
    let edit = useEditForm(params.id);
    let destroy = useDestroyForm();

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
                    <form {...edit}>
                        <button type="submit">Edit</button>
                    </form>
                    <form {...destroy} className="destroy-form">
                        <input name="id" type="hidden" value={params.id} />
                        <button type="submit">Delete</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Favorite(props: { favorite: boolean; id: string }) {
    let next = !props.favorite;
    let favorite = useFavoriteForm(props.id, next);

    return (
        <form {...favorite}>
            <input name="id" type="hidden" value={props.id} />
            <input name="favorite" type="hidden" value={next ? "true" : "false"} />
            <button
                aria-label={props.favorite ? "Remove from favorites" : "Add to favorites"}
                data-favorited={props.favorite}
                type="submit"
            >
                {props.favorite ? "★" : "☆"}
            </button>
        </form>
    );
}
