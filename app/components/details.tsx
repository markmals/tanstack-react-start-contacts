import { useNavigating } from "#/lib/hooks.ts";
import { Outlet } from "@tanstack/react-router";

export function Details() {
    let isNavigating = useNavigating();

    return (
        <div className={isNavigating ? "loading" : ""} id="detail">
            <Outlet />
        </div>
    );
}
