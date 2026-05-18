import type { Id } from "#convex/_generated/dataModel.js";

import { createContact, destroyContact, toggleFavorite } from "#/lib/data/mutations.ts";
import { api } from "#convex/_generated/api.js";
import { linkOptions, useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "convex/react";
import { type ComponentProps } from "react";

import { useHref } from "../href.ts";

export function NewButton(props: ComponentProps<"form">) {
    let create = useServerFn(createContact);
    return (
        <form
            action={createContact.url}
            method={createContact.method}
            onSubmit={async event => {
                event.preventDefault();
                await create();
            }}
            {...props}
        >
            <button type="submit">New</button>
        </form>
    );
}

export function DeleteButton(props: ComponentProps<"form"> & { id: string }) {
    let destroy = useServerFn(destroyContact);
    return (
        <form
            action={destroyContact.url}
            method={destroyContact.method}
            onSubmit={async event => {
                event.preventDefault();

                if (!confirm("Please confirm you want to delete this record.")) {
                    return;
                }

                await destroy({ data: new FormData(event.currentTarget) });
            }}
            {...props}
        >
            <input name="id" type="hidden" value={props.id} />
            <button type="submit">Delete</button>
        </form>
    );
}

export function EditButton(props: ComponentProps<"form"> & { id: string }) {
    let navigate = useNavigate();
    let options = linkOptions({ to: "/contact/$id/edit", params: { id: props.id } });
    let editHref = useHref(options);

    return (
        <form
            action={editHref}
            method="get"
            onSubmit={async event => {
                event.preventDefault();
                await navigate(options);
            }}
            {...props}
        >
            <button type="submit">Edit</button>
        </form>
    );
}

export function FavoriteButton(props: ComponentProps<"form"> & { id: string; next: boolean }) {
    let toggle = useMutation(api.contacts.update).withOptimisticUpdate((localStore, args) => {
        let favorite = args.favorite;
        if (favorite === undefined) return;

        let contact = localStore.getQuery(api.contacts.get, { id: args.id });
        if (contact) {
            localStore.setQuery(api.contacts.get, { id: args.id }, { ...contact, favorite });
        }
    });

    return (
        <form
            action={toggleFavorite.url}
            method={toggleFavorite.method}
            onSubmit={async event => {
                event.preventDefault();
                await toggle({ id: props.id as Id<"contacts">, favorite: props.next });
            }}
            {...props}
        />
    );
}

export function CancelButton(props: ComponentProps<"button"> & { id: string }) {
    let router = useRouter();
    let navigate = useNavigate();
    let canGoBack = useCanGoBack();

    function handleClick() {
        if (canGoBack) {
            router.history.back();
        } else {
            navigate({ to: "/contact/$id", params: { id: props.id } });
        }
    }

    return (
        <button {...props} onClick={handleClick} type="button">
            Cancel
        </button>
    );
}
