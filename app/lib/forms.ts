import type { Id } from "#convex/_generated/dataModel.js";

import { api } from "#convex/_generated/api.js";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "convex/react";
import { type ComponentProps } from "react";

import { useHref } from "./href.ts";
import { createContact, destroyContact, editContact, toggleFavorite } from "./server-fns.ts";

export type FormDirective = Pick<ComponentProps<"form">, "action" | "method" | "onSubmit">;

export function useCreateForm(): FormDirective {
    let create = useServerFn(createContact);
    return {
        method: createContact.method,
        action: createContact.url,
        onSubmit: async () => {
            await create();
        },
    };
}

export function useDestroyForm(): FormDirective {
    let destroy = useServerFn(destroyContact);
    return {
        method: destroyContact.method,
        action: destroyContact.url,
        onSubmit: async event => {
            event.preventDefault();

            if (!confirm("Please confirm you want to delete this record.")) {
                return;
            }

            await destroy({ data: new FormData(event.currentTarget) });
        },
    };
}

export function useUpdateForm(): FormDirective {
    let edit = useServerFn(editContact);
    return {
        method: editContact.method,
        action: editContact.url,
        onSubmit: async event => {
            event.preventDefault();
            await edit({ data: new FormData(event.currentTarget) });
        },
    };
}

export function useEditForm(id: string): FormDirective {
    let navigate = useNavigate();
    let editHref = useHref({ to: "/contact/$id/edit", params: { id } });
    return {
        method: "get",
        action: editHref,
        onSubmit: async event => {
            event.preventDefault();
            await navigate({ to: "/contact/$id/edit", params: { id } });
        },
    };
}

export function useFavoriteForm(id: string, next: boolean): FormDirective {
    let toggle = useMutation(api.contacts.update).withOptimisticUpdate((localStore, args) => {
        let favorite = args.favorite;
        if (favorite === undefined) return;

        let contact = localStore.getQuery(api.contacts.get, { id: args.id });
        if (contact) {
            localStore.setQuery(api.contacts.get, { id: args.id }, { ...contact, favorite });
        }
    });

    return {
        method: toggleFavorite.method,
        action: toggleFavorite.url,
        onSubmit: async event => {
            event.preventDefault();
            await toggle({ id: id as Id<"contacts">, favorite: next });
        },
    };
}
