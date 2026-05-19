import { createFileRoute } from "@tanstack/react-router";

export let Route = createFileRoute("/")({
    component: EmptyState,
});

function EmptyState() {
    return (
        <p className="mx-auto my-8 text-center text-muted before:mx-auto before:mb-2 before:block before:h-40 before:w-40 before:bg-[url('/empty-state-splash.svg')] before:bg-contain before:bg-center before:bg-no-repeat before:content-['']">
            This is a demo for TanStack React Start.
            <br />
            Check out{" "}
            <a
                className="text-inherit underline hover:text-foreground"
                href="https://tanstack.com/start/latest/docs/framework/react/overview"
            >
                the docs at tanstack.com/start
            </a>
            .
        </p>
    );
}
