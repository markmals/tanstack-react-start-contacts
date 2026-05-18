import {
    Outlet,
    createRootRoute,
    Scripts,
    useNavigate,
    Link,
    useRouterState,
} from "@tanstack/react-router";
import { useActionState, type InputEvent } from "react";

import styles from "./index.css?url";
import { QuerySchema, fromSearch } from "./lib/schemas.ts";
import { createContact, getContacts } from "./lib/server-fns.ts";

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
    let { isLoading } = useRouterState();
    let navigate = useNavigate();

    let searching = Boolean(pendingQuery);
    let value = pendingQuery ?? query ?? "";

    function handleInput(event: InputEvent<HTMLInputElement>) {
        let next = event.currentTarget.value.trim() || undefined;
        let isFirstSearch = pendingQuery === undefined;
        navigate({
            to: ".",
            search: prev => ({ ...prev, q: next }),
            replace: !isFirstSearch,
        });
    }

    let [, createAction] = useActionState(() => createContact(), undefined, createContact.url);

    return (
        <div id="root">
            <div id="sidebar">
                <h1>React Router Contacts</h1>
                <div>
                    <form id="search-form" method="get">
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
                        <div aria-live="polite" className="sr-only" />
                    </form>
                    <form action={createAction} method="post">
                        <button type="submit">New</button>
                    </form>
                </div>
                <nav>
                    {contacts.length ? (
                        <ul>
                            {contacts.map(contact => (
                                <li key={contact.id}>
                                    <Link
                                        activeProps={{ className: "active" }}
                                        className={isLoading ? "pending" : undefined}
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
                            ))}
                        </ul>
                    ) : (
                        <p>
                            <i>No contacts</i>
                        </p>
                    )}
                </nav>
            </div>
            <div className={isLoading ? "loading" : ""} id="detail">
                <Outlet />
            </div>
        </div>
    );
}
