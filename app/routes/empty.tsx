import { createFileRoute } from "@tanstack/react-router";

export let Route = createFileRoute("/")({
    component: EmptyState,
});

function EmptyState() {
    return (
        <p id="zero-state">
            This is a demo for TanStack React Start.
            <br />
            Check out{" "}
            <a href="https://tanstack.com/start/latest/docs/framework/react/overview">
                the docs at tanstack.com/start
            </a>
            .
        </p>
    );
}
