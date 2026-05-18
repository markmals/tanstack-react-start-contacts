import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { Scripts, createRootRouteWithContext } from "@tanstack/react-router";

import styles from "./index.css?url";
import { NewButton } from "./lib/components/buttons.tsx";
import { Details } from "./lib/components/details.tsx";
import { SearchForm } from "./lib/components/forms.tsx";
import { SidebarItem } from "./lib/components/sidebar-item.tsx";
import { listContactsQuery } from "./lib/data/queries.ts";
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
    let { data: contacts } = useSuspenseQuery(listContactsQuery(q));

    return (
        <div id="root">
            <div id="sidebar">
                <h1>TanStack Contacts</h1>
                <div>
                    <SearchForm query={q} results={contacts.length} />
                    <NewButton />
                </div>
                <nav>
                    {contacts.length ? (
                        <ul>
                            {contacts.map(contact => (
                                <SidebarItem contact={contact} />
                            ))}
                        </ul>
                    ) : (
                        <p>
                            <i>No contacts</i>
                        </p>
                    )}
                </nav>
            </div>
            <Details />
        </div>
    );
}
