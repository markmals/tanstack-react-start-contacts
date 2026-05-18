import type { InputEvent } from "react";

import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";

export function useCancelHandler(id: string) {
    let router = useRouter();
    let navigate = useNavigate();
    let canGoBack = useCanGoBack();

    return () => {
        if (canGoBack) {
            router.history.back();
        } else {
            navigate({ to: "/contact/$id", params: { id } });
        }
    };
}

export function useSearchHandler(query?: string) {
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

    return {
        value,
        onInput(event: InputEvent<HTMLInputElement>) {
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
        },
    };
}
