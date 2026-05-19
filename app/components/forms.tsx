import { updateContact } from "#/data/mutations.ts";
import { useNavigating } from "#/lib/hooks.ts";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, type ComponentProps, type InputEvent } from "react";

export function EditContactForm(props: ComponentProps<"form">) {
    let edit = useServerFn(updateContact);
    return (
        <form
            action={updateContact.url}
            method={updateContact.method}
            onSubmit={async event => {
                event.preventDefault();
                await edit({ data: new FormData(event.currentTarget) });
            }}
            {...props}
            className={`flex max-w-160 flex-col gap-4 ${props.className ?? ""}`}
        />
    );
}

export function SearchForm({
    query,
    results,
    ...props
}: ComponentProps<"input"> & { query?: string; results: number }) {
    let { isLoading } = useRouterState();
    let isNavigating = useNavigating();
    let searching = isLoading && !isNavigating;

    let navigate = useNavigate();

    // Local state so the input updates immediately on type — TanStack Router
    // wraps navigations in React transitions, so Route.useSearch() returns the
    // previously committed value while a loader is in flight, which would
    // reset a URL-driven controlled input between keystrokes.
    let [value, setValue] = useState(query ?? "");

    // Sync from URL on external navigation (back/forward) using the
    // "adjust state during render" pattern, preferred over setState-in-effect.
    // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    let [syncedQuery, setSyncedQuery] = useState(query);
    if (query !== syncedQuery) {
        setSyncedQuery(query);
        setValue(query ?? "");
    }

    // Track the just-typed value so the push-vs-replace decision is correct
    // even when React hasn't re-rendered between fast keystrokes (the closed-
    // over `value` and the loader-derived `query` both lag).
    let liveRef = useRef(value);
    liveRef.current = value;

    let resultsLabel = query ? `${results} result${results === 1 ? "" : "s"} for "${query}"` : "";

    function handleInput(event: InputEvent<HTMLInputElement>) {
        let next = event.currentTarget.value;
        // Push for the first keystroke of a session, replace as the user
        // refines, so back returns to the pre-search state.
        let alreadySearching = liveRef.current.trim() !== "";
        liveRef.current = next;
        setValue(next);
        let q = next.trim() || undefined;
        return navigate({
            to: ".",
            search: prev => ({ ...prev, q }),
            replace: alreadySearching,
        });
    }

    return (
        <form className="relative" id="search-form" method="get" onSubmit={e => e.preventDefault()}>
            <input
                {...props}
                aria-label="Search contacts"
                className={`w-full bg-no-repeat bg-size-[1rem] bg-position-[0.625rem_0.75rem] pl-8 ${searching ? "" : "search-icon"}`}
                id="q"
                name="q"
                onInput={handleInput}
                placeholder="Search"
                type="search"
                value={value}
            />
            <div
                aria-hidden
                className="spinner-icon absolute left-2.5 top-3 h-4 w-4 animate-spin bg-no-repeat"
                hidden={!searching}
                id="search-spinner"
            />
            <div aria-live="polite" className="sr-only">
                {searching ? "" : resultsLabel}
            </div>
        </form>
    );
}
