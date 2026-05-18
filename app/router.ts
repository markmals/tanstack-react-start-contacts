import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routes.gen.ts";

if (import.meta.env.DEV && import.meta.env.SSR) {
    let { seedDatabase } = await import("./lib/seed.ts");
    await seedDatabase();
}

export function getRouter() {
    return createRouter({
        routeTree,
        scrollRestoration: true,
    });
}
