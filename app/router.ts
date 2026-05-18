import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routes.gen.ts";

export function getRouter() {
    return createRouter({
        routeTree,
        defaultPreload: "intent",
        scrollRestoration: true,
    });
}
