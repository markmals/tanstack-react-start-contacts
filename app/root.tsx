import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { Scripts, createRootRouteWithContext } from "@tanstack/react-router";

import { NewButton } from "./components/buttons.tsx";
import { Details } from "./components/details.tsx";
import { SearchForm } from "./components/forms.tsx";
import { SidebarItem } from "./components/sidebar-item.tsx";
import { listContactsQuery } from "./data/queries.ts";
import { QuerySchema, fromSearch } from "./lib/schemas.ts";
import styles from "./styles/index.css?url";

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
        <div className="flex h-full w-full">
            <div className="flex w-88 flex-col border-r border-border bg-sidebar">
                <h1 className="order-1 m-0 flex items-center border-t border-border px-8 py-4 text-base font-medium leading-none before:mr-3 before:inline-block before:h-7 before:w-7 before:bg-[url('/tanstack-logo-small.png')] before:bg-contain before:bg-center before:bg-no-repeat before:content-['']">
                    TanStack Contacts
                </h1>
                <div className="flex items-center gap-2 border-b border-border px-8 py-4">
                    <SearchForm query={q} results={contacts.length} />
                    <NewButton />
                </div>
                <nav className="flex-1 overflow-auto px-8 pt-4">
                    {contacts.length ? (
                        <ul className="m-0 list-none p-0">
                            {contacts.map(contact => (
                                <SidebarItem contact={contact} key={contact._id} />
                            ))}
                        </ul>
                    ) : (
                        <p>
                            <i className="text-muted">No contacts</i>
                        </p>
                    )}
                </nav>
            </div>
            <Details />
        </div>
    );
}
