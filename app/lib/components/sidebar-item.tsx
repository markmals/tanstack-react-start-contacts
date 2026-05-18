import type { Doc } from "#convex/_generated/dataModel.js";

import { Link, useLocation } from "@tanstack/react-router";

import { useNavigating } from "../hooks.ts";
import { useHref } from "../href.ts";

export function SidebarItem({ contact }: { contact: Doc<"contacts"> }) {
    let location = useLocation();
    let isNavigating = useNavigating();
    let pendingContactPath = isNavigating ? location.pathname : undefined;

    let url = useHref({
        to: "/contact/$id",
        params: { id: contact._id },
    });
    let isPending = pendingContactPath === url;

    return (
        <li key={contact._id}>
            <Link
                activeProps={isPending ? {} : { className: "active" }}
                className={isPending ? "pending" : undefined}
                params={{ id: contact._id }}
                to="/contact/$id"
            >
                {contact.first || contact.last ? (
                    <>
                        {contact.first} {contact.last}
                    </>
                ) : (
                    <i>No Name</i>
                )}
                {contact.favorite && <span>★</span>}
            </Link>
        </li>
    );
}
