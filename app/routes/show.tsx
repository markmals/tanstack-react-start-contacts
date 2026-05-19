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
        <div className="flex max-w-160">
            <title>{`${contact.first} ${contact.last} | TanStack Contacts`}</title>
            <div>
                <img
                    alt=""
                    className="mr-8 h-48 w-48 rounded-3xl bg-avatar object-cover"
                    key={contact.avatar}
                    src={
                        hasAvatar
                            ? (contact.avatar ?? undefined)
                            : "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
                    }
                />
            </div>

            <div>
                <h1 className="m-0 flex items-start gap-4 text-[2rem] leading-[1.2] font-bold focus:text-primary focus:outline-none">
                    {contact.first || contact.last ? (
                        <>
                            {contact.first} {contact.last}
                        </>
                    ) : (
                        <i className="text-muted">No Name</i>
                    )}{" "}
                    <Favorite favorite={contact.favorite} id={params.id} key={params.id} />
                </h1>

                {contact.bsky && (
                    <p className="m-0">
                        <a
                            className="flex text-2xl text-bsky no-underline hover:underline"
                            href={`https://bsky.app/profile/${contact.bsky}`}
                            rel="noreferrer"
                            target="_blank"
                        >
                            @{contact.bsky}
                        </a>
                    </p>
                )}

                {contact.notes && <p className="whitespace-break-spaces">{contact.notes}</p>}

                <div className="my-4 flex gap-2">
                    <EditButton id={params.id} />
                    <DeleteButton id={params.id} />
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
                className="p-0 text-2xl font-normal shadow-none data-[favorited=false]:text-unfavorited data-[favorited=false]:hover:text-favorite data-[favorited=true]:text-favorite"
                data-favorited={props.favorite}
                type="submit"
            >
                {props.favorite ? "★" : "☆"}
            </button>
        </FavoriteButton>
    );
}
