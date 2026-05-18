import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useActionState } from "react";

import { useHref } from "./href.ts";
import { createContact, destroyContact, editContact } from "./server-fns.ts";

export function useCreateAction() {
    let router = useRouter();
    let create = useServerFn(createContact);
    let [, createAction] = useActionState(
        async () => {
            await create();
            await router.invalidate();
        },
        undefined,
        createContact.url,
    );
    return createAction;
}

export function useDestroyAction() {
    let router = useRouter();
    let destroy = useServerFn(destroyContact);
    let [, destroyAction] = useActionState(
        async (_state: void, formData: FormData) => {
            if (!confirm("Please confirm you want to delete this record.")) {
                return;
            }

            await destroy({ data: formData });
            await router.invalidate();
        },
        undefined,
        destroyContact.url,
    );
    return destroyAction;
}

export function useUpdateAction() {
    let router = useRouter();
    let edit = useServerFn(editContact);
    let [, updateAction] = useActionState(
        async (_state: void, data: FormData) => {
            await edit({ data });
            await router.invalidate();
        },
        undefined,
        editContact.url,
    );
    return updateAction;
}

export function useEditAction(id: string) {
    let navigate = useNavigate();
    let editHref = useHref({ to: "/contact/$id/edit", params: { id } });
    let [, editAction] = useActionState(
        () => navigate({ to: "/contact/$id/edit", params: { id } }),
        undefined,
        editHref,
    );
    return editAction;
}
