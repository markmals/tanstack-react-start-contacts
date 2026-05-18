import { Outlet, createRootRoute, Scripts, Link, useRouterState } from "@tanstack/react-router";

import styles from "./index.css?url";
import { useCreateAction, useSearchHandler } from "./lib/hooks.ts";
import { QuerySchema, fromSearch } from "./lib/schemas.ts";
import { getContacts } from "./lib/server-fns.ts";

export let Route = createRootRoute({
    validateSearch: fromSearch<{ q?: string }>()(QuerySchema),
    loaderDeps: ({ search: { q } }) => ({ q }),
    loader: async ({ deps: { q } }) => ({ contacts: await getContacts({ data: { q } }), query: q }),
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
    let { contacts, query } = Route.useLoaderData();

    let { q: pendingQuery } = Route.useSearch();
    let handleInput = useSearchHandler(pendingQuery);

    let { isFetching } = Route.useMatch();
    let searching = isFetching === "loader";

    let { isLoading, location, resolvedLocation } = useRouterState();
    let isNavigating = isLoading && location.pathname !== resolvedLocation?.pathname;
    let pendingContactPath = isNavigating ? location.pathname : undefined;

    let value = pendingQuery ?? query ?? "";
    let resultsLabel = query
        ? `${contacts.length} result${contacts.length === 1 ? "" : "s"} for "${query}"`
        : "";

    let createAction = useCreateAction();

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
                            onInput={handleInput}
                            placeholder="Search"
                            type="search"
                            value={value}
                        />
                        <div aria-hidden hidden={!searching} id="search-spinner" />
                        <div aria-live="polite" className="sr-only">
                            {searching ? "" : resultsLabel}
                        </div>
                    </form>
                    <form action={createAction}>
                        <button type="submit">New</button>
                    </form>
                </div>
                <nav>
                    {contacts.length ? (
                        <ul>
                            {contacts.map(contact => {
                                let isPending =
                                    pendingContactPath === `/contact/${contact.id}`;
                                return (
                                    <li key={contact.id}>
                                        <Link
                                            activeProps={isPending ? {} : { className: "active" }}
                                            className={isPending ? "pending" : undefined}
                                            params={{ id: String(contact.id) }}
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
