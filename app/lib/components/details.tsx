import { Outlet } from "@tanstack/react-router";

import { useNavigating } from "../hooks.ts";

export function Details() {
    let isNavigating = useNavigating();

    return (
        <div className={isNavigating ? "loading" : ""} id="detail">
            <Outlet />
        </div>
    );
}
