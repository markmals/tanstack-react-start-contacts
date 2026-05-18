import { useQuery, type QueryClient } from "@tanstack/react-query";
import {
    Outlet,
    Scripts,
    Link,
    createRootRouteWithContext,
    useRouterState,
} from "@tanstack/react-router";
import { use } from "react";

import styles from "./index.css?url";
import { useCreateForm } from "./lib/forms.ts";
import { useSearchHandler } from "./lib/hooks.ts";
import { useHref } from "./lib/href.ts";
import { listContactsQuery } from "./lib/queries.ts";
import { QuerySchema, fromSearch } from "./lib/schemas.ts";

export let Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    validateSearch: fromSearch<{ q?: string }>()(QuerySchema),
    loaderDeps: ({ search: { q } }) => ({ q }),
    loader: ({ context: { queryClient }, deps: { q } }) =>
        queryClient.ensureQueryData(listContactsQuery(q)),
    component: Root,
});

function Root() {
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <meta content="width=device-width, initial-scale=1" name="viewport" />
                <link href={styles} rel="stylesheet" />
                <link href="/favicon.ico" rel="icon" type="image/x-icon" />
                <title>TanStack Contacts</title>
            </head>
            <body>
                <App />
                <Scripts />
            </body>
        </html>
    );
}

function App() {
    let { q } = Route.useLoaderDeps();
    let { promise } = useQuery(listContactsQuery(q));
    let contacts = use(promise);

    let { value, onInput } = useSearchHandler(q);

    let { isLoading, location, resolvedLocation } = useRouterState();
    let isNavigating = isLoading && location.pathname !== resolvedLocation?.pathname;
    let searching = isLoading && !isNavigating;
    let pendingContactPath = isNavigating ? location.pathname : undefined;

    let resultsLabel = q
        ? `${contacts.length} result${contacts.length === 1 ? "" : "s"} for "${q}"`
        : "";

    let create = useCreateForm();

    return (
        <div id="root">
            <div id="sidebar">
                <h1>TanStack Contacts</h1>
                <div>
                    <form id="search-form" method="get" onSubmit={e => e.preventDefault()}>
                        <input
                            aria-label="Search contacts"
                            className={searching ? "loading" : ""}
                            id="q"
                            name="q"
                            onInput={onInput}
                            placeholder="Search"
                            type="search"
                            value={value}
                        />
                        <div aria-hidden hidden={!searching} id="search-spinner" />
                        <div aria-live="polite" className="sr-only">
                            {searching ? "" : resultsLabel}
                        </div>
                    </form>
                    <form {...create}>
                        <button type="submit">New</button>
                    </form>
                </div>
                <nav>
                    {contacts.length ? (
                        <ul>
                            {contacts.map(contact => {
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
                            })}
                        </ul>
                    ) : (
                        <p>
                            <i>No contacts</i>
                        </p>
                    )}
                </nav>
            </div>
            <div className={isNavigating ? "loading" : ""} id="detail">
                <Outlet />
            </div>
        </div>
    );
}
