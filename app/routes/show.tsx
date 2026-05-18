import { DeleteButton, EditButton, FavoriteButton } from "#/components/buttons.tsx";
import { getContactQuery } from "#/data/queries.ts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

export let Route = createFileRoute("/contact/$id")({
    async loader({ context: { queryClient }, params }) {
        let contact = await queryClient.ensureQueryData(getContactQuery(params.id));
        if (!contact) throw notFound();
    },
    component: ShowContact,
});

function ShowContact() {
    let params = Route.useParams();
    let { data: contact } = useSuspenseQuery(getContactQuery(params.id));
    if (!contact) throw notFound();

    let hasAvatar = Boolean(contact.avatar);

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
                    <EditButton id={params.id} />
                    <DeleteButton className="destroy-form" id={params.id} />
                </div>
            </div>
        </div>
    );
}

function Favorite(props: { favorite: boolean; id: string }) {
    let nextValue = !props.favorite;

    return (
        <FavoriteButton id={props.id} next={nextValue}>
            <input name="id" type="hidden" value={props.id} />
            <input name="favorite" type="hidden" value={nextValue ? "true" : "false"} />
            <button
                aria-label={props.favorite ? "Remove from favorites" : "Add to favorites"}
                data-favorited={props.favorite}
                type="submit"
            >
                {props.favorite ? "★" : "☆"}
            </button>
        </FavoriteButton>
    );
}
