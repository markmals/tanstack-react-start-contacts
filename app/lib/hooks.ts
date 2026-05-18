import { useRouterState } from "@tanstack/react-router";

export function useNavigating(): boolean {
    let { isLoading, location, resolvedLocation } = useRouterState();
    return isLoading && location.pathname !== resolvedLocation?.pathname;
}
