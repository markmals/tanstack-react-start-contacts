import type { PropsWithChildren } from "react";

import { QueryClientProvider, dehydrate, hydrate } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { createConvexQueryClient } from "./lib/convex.ts";
import { parseEnv } from "./lib/schemas.ts";
import { routeTree } from "./routes.gen.ts";

const { DEV, SSR } = parseEnv(import.meta.env);

if (DEV && SSR) {
    let { seedDatabase } = await import("./lib/seed.ts");
    await seedDatabase();
}

export function getRouter() {
    let { queryClient } = createConvexQueryClient();

    function Wrap({ children }: PropsWithChildren) {
        return <QueryClientProvider children={children} client={queryClient} />;
    }

    let router = createRouter({
        routeTree,
        scrollRestoration: true,
        defaultPreload: "intent",
        context: { queryClient },
        Wrap,
        // The router's serializer doesn't recognize react-query's DehydratedState
        // shape (it contains `unknown[]` keys), so we move it across the SSR/CSR
        // boundary as a JSON string — DehydratedState is JSON-safe by design.
        dehydrate: () => ({ queryClientState: JSON.stringify(dehydrate(queryClient)) }),
        hydrate: (dehydrated: { queryClientState: string }) => {
            hydrate(queryClient, JSON.parse(dehydrated.queryClientState));
        },
    });

    setupRouterSsrQueryIntegration({
        router,
        queryClient,
    });

    return router;
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
