import type { Doc } from "#convex/_generated/dataModel.js";

import { useNavigating } from "#/lib/hooks.ts";
import { useHref } from "#/lib/href.ts";
import { Link, useLocation } from "@tanstack/react-router";

export function SidebarItem({ contact }: { contact: Doc<"contacts"> }) {
    let location = useLocation();
    let isNavigating = useNavigating();
    let pendingContactPath = isNavigating ? location.pathname : undefined;

    let url = useHref({
        to: "/contact/$id",
        params: { id: contact._id },
    });
    let isPending = pendingContactPath === url;
    let isActive =
        !isPending && (location.pathname === url || location.pathname.startsWith(`${url}/`));

    let linkClass =
        "flex items-center justify-between gap-4 overflow-hidden whitespace-pre rounded-lg p-2 no-underline";
    if (isActive) {
        linkClass += " bg-primary text-white hover:bg-primary";
    } else if (isPending) {
        linkClass += " text-primary";
    } else {
        linkClass += " text-inherit hover:bg-border";
    }

    return (
        <li className="my-1">
            <Link className={linkClass} params={{ id: contact._id }} to="/contact/$id">
                {contact.first || contact.last ? (
                    <>
                        {contact.first} {contact.last}
                    </>
                ) : (
                    <i className={isActive ? "" : "text-muted"}>No Name</i>
                )}
                {contact.favorite && (
                    <span className={`float-right ${isActive ? "" : "text-favorite"}`}>★</span>
                )}
            </Link>
        </li>
    );
}
