import {
    useRouter,
    type RegisteredRouter,
    type ToOptions,
    type ValidateLinkOptions,
} from "@tanstack/react-router";

// Hook (not a standalone function) because on the server `getRouterInstance()`
// returns `Awaitable<RegisteredRouter>` — there's no synchronous way to read it
// outside a React render. `useRouter()` pulls the resolved router from context.
export function useHref<const TOptions>(
    options: ValidateLinkOptions<RegisteredRouter, TOptions, string, "a">,
): string {
    let router = useRouter();
    return router.buildLocation(options as ToOptions).href;
}
