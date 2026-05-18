import type { PropsWithChildren } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexProvider } from "convex/react";

import { createConvexQueryClient } from "./lib/data/convex.ts";
import { parseEnv } from "./lib/schemas.ts";
import { routeTree } from "./routes.gen.ts";

const { DEV, SSR } = parseEnv(import.meta.env);

if (DEV && SSR) {
    let { seedDatabase } = await import("./lib/data/seed.ts");
    await seedDatabase();
}

export function getRouter() {
    let { convex, queryClient } = createConvexQueryClient();

    function Wrap({ children }: PropsWithChildren) {
        return (
            <ConvexProvider client={convex}>
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </ConvexProvider>
        );
    }

    let router = createRouter({
        routeTree,
        scrollRestoration: true,
        defaultPreload: "intent",
        context: { queryClient },
        Wrap,
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
