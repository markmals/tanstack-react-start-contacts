import {
    useRouter,
    type RegisteredRouter,
    type ToOptions,
    type ValidateLinkOptions,
} from "@tanstack/react-router";

export function useHref<const TOptions>(
    options: ValidateLinkOptions<RegisteredRouter, TOptions, string, "a">,
): string {
    let router = useRouter();
    return router.buildLocation(options as ToOptions).href;
}
