import { rootRoute, route, index } from "@tanstack/virtual-file-routes";

export let routes = rootRoute("root.tsx", [
    index("routes/empty.tsx"),
    route("contact/$id", "routes/show.tsx"),
    route("contact/$id/edit", "routes/edit.tsx"),
]);
