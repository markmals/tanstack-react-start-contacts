import { useNavigating } from "#/lib/hooks.ts";
import { Outlet } from "@tanstack/react-router";

export function Details() {
    let isNavigating = useNavigating();

    return (
        <div
            className={`w-full flex-1 px-16 py-8 ${isNavigating ? "opacity-25 transition-opacity delay-200 duration-200" : ""}`}
            id="detail"
        >
            <Outlet />
        </div>
    );
}
