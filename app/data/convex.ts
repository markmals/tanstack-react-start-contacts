import { parseEnv } from "#/lib/schemas.ts";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";

const { VITE_CONVEX_URL } = parseEnv(import.meta.env);

// One per request on the server, one per page on the client. Each call wires a
// fresh QueryClient up to a ConvexReactClient via @convex-dev/react-query so
// that queries are routed through Convex's HTTP client during SSR and over
// WebSocket in the browser.
export function createConvexQueryClient() {
    let convex = new ConvexReactClient(VITE_CONVEX_URL);
    let convexQueryClient = new ConvexQueryClient(convex);

    let queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                queryKeyHashFn: convexQueryClient.hashFn(),
                queryFn: convexQueryClient.queryFn(),
                experimental_prefetchInRender: true,
            },
        },
    });

    convexQueryClient.connect(queryClient);

    return { convex, queryClient, convexQueryClient };
}

// Used by server functions to invoke Convex mutations during a TanStack Start
// request — the same handler that the form posts to also runs in the Worker, so
// we go over HTTP rather than dragging a WebSocket into the request lifecycle.
export function createConvexHttpClient() {
    return new ConvexHttpClient(VITE_CONVEX_URL);
}
