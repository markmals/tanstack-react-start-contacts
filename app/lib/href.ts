import {
    type RegisteredRouter,
    type ToOptions,
    type ValidateLinkOptions,
} from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";

export function href<const TOptions>(
    options: ValidateLinkOptions<RegisteredRouter, TOptions, string, "a">,
): string {
    let router = getRouterInstance() as RegisteredRouter;
    return router.buildLocation(options as ToOptions).href;
}
