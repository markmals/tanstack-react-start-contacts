# Architecture: SSR on Cloudflare Workers with TanStack Start + Convex

This document captures the architecture of this repository as a reference
implementation. The goal is that a human or agent picking up a greenfield app
can use it as an _archetype_: the choices, the seams, the gotchas, and the
reasons behind them. It is not a tutorial on any one tool — it is a guide to
how these tools compose, and what to do (and not do) at each seam.

The stack:

- **TanStack Start** — SSR framework + server functions (RPC).
- **TanStack Router** — file-based router with loaders and typed search params.
- **TanStack React Query** — client cache, hydrated from the SSR render.
- **`@tanstack/react-router-ssr-query`** — the wire that dehydrates the
  QueryClient on the server and rehydrates it on the client.
- **Convex** — backend as a service: database, serverless functions, realtime
  subscriptions, codegen.
- **`@convex-dev/react-query`** — adapter that lets Convex queries be expressed
  as React Query options (with realtime updates wired in via WebSocket on the
  client).
- **Cloudflare Workers** — the SSR runtime, via `@cloudflare/vite-plugin` and
  `wrangler`.
- **Vite (vite-plus)** — dev server, build, task runner.
- **Tailwind CSS v4** — styling via `@tailwindcss/vite`, with design tokens
  declared in `@theme` and component-local utility classes everywhere else.
- **Valibot** + **`@conform-to/valibot`** — schema validation at all the
  boundaries (search params, form data, env vars).

If you are building a new app on this stack, the patterns here should transfer
1:1. If you are extending this app, read **§ Conventions & Gotchas** first.

---

## 0. The prime directive: every interaction works without JavaScript

This is the single most load-bearing architectural commitment in the
codebase. Internalize it before reading anything else.

**Every user-visible action — clicking a button, submitting a form,
navigating between pages, toggling a favorite, deleting a record — works
when JavaScript is disabled, broken, slow to load, or in the middle of
hydrating.** JS is an _enhancement_, not a requirement.

Concretely, this means:

- **Buttons that perform actions are `<form>`s, not `<button onClick>`s.**
  A bare `onClick` is dead without JS; a `<form action="/...">` posts to
  the Worker and the browser navigates. See [`NewButton`](app/components/buttons.tsx),
  [`DeleteButton`](app/components/buttons.tsx), [`EditButton`](app/components/buttons.tsx),
  and [`FavoriteButton`](app/components/buttons.tsx) — they are all
  `<form>` elements.
- **Navigation that mutates state is a form post.** "Edit this contact"
  is a `<form method="get" action="/contact/:id/edit">`. Even though
  it's just a navigation, modeling it as a form means there is one
  consistent affordance and no ambiguity about JS dependency.
- **Mutations are server functions with stable URLs.** Every
  `createServerFn({ method: "POST" })` produces a `.url` you can put in
  a `<form action>`. The Worker handles the POST whether the request
  arrives from a JS-enhanced submit or a vanilla form. The handler does
  not know or care which path the request came from — it validates the
  same `FormData`, performs the same mutation, throws the same
  `redirect(...)`.
- **The JS enhancement is layered on top.** Each form has an
  `onSubmit` that calls `event.preventDefault()` and routes through
  `useServerFn(...)`. If JS is missing, the browser ignores `onSubmit`
  and submits natively. If JS is present, the enhanced path runs and
  the user gets client-side navigation, optimistic UI, and confirm
  dialogs.

The architectural payoff is not abstract:

- **First paint is interactive.** Users can click "Delete" before
  hydration finishes; the form posts to the Worker exactly as it would
  post-hydration.
- **Bots, screen readers, and "Reader Mode" all work.** Native form
  submission is the lowest-common-denominator browser primitive.
- **Failures are graceful.** If a route's JS chunk fails to load, the
  app still functions.
- **Mental model stays simple.** There is one canonical mutation path
  (Worker handler over HTTP). The JS enhancement reuses it, never
  forks it.

The corollary, which is just as important: **do not introduce code paths
that only work with JS.** If you find yourself reaching for
`<button onClick>` for anything other than purely client-side UI
(opening a menu, focusing an input), stop and ask whether a `<form>`
would do. The answer is almost always yes.

There is exactly one operation in this archetype that requires JS: the
favorite toggle uses a direct Convex `useMutation` for optimistic
updates ([`FavoriteButton`](app/components/buttons.tsx)). Even that one
is still a `<form action={toggleFavorite.url}>` — without JS, it
degrades to a normal server-function POST that re-renders the page.
The optimistic flicker is the _enhancement_; correctness lives in the
server function.

---

## 1. Mental model: three logical tiers

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│  - React + TanStack Router (client routing, hydration)           │
│  - TanStack Query cache (hydrated from SSR, then live)           │
│  - ConvexReactClient (WebSocket → realtime updates)              │
└──────────────┬────────────────────────────┬─────────────────────┘
               │                            │
               │ HTTP (server fns)          │ WebSocket (Convex)
               │                            │
┌──────────────▼────────────────┐   ┌───────▼──────────────────────┐
│  Cloudflare Worker (SSR)      │   │  Convex (managed backend)    │
│  - TanStack Start server      │   │  - Database                  │
│    entry                      │   │  - Queries/mutations/actions │
│  - Server function handlers   │   │  - Reactive subscriptions    │
│  - ConvexHttpClient on SSR    │──▶│                              │
│    + per-request QueryClient  │   │                              │
└───────────────────────────────┘   └──────────────────────────────┘
```

The Worker renders HTML and runs server functions. Convex owns persistence and
push-based updates. The browser bridges the two via React Query + a Convex
client. **Do not put long-lived state on the Worker.** A Worker invocation is
ephemeral; durable state lives in Convex.

---

## 2. File layout

```
.
├── app/
│   ├── root.tsx               # Root route: <html>, layout, sidebar, search
│   ├── router.tsx             # createRouter + provider wiring
│   ├── routes.ts              # Virtual route config (input)
│   ├── routes.gen.ts          # Generated route tree (do not edit)
│   ├── routes/                # Route components (referenced by routes.ts)
│   │   ├── empty.tsx
│   │   ├── show.tsx
│   │   └── edit.tsx
│   ├── components/            # Presentation; no data fetching
│   ├── data/
│   │   ├── convex.ts          # Client factories (HTTP + React)
│   │   ├── queries.ts         # convexQuery() options builders
│   │   ├── mutations.ts       # createServerFn() handlers
│   │   └── seed.ts            # Dev-only seeding
│   ├── lib/
│   │   ├── schemas.ts         # Valibot validators + parseEnv
│   │   ├── href.ts            # useHref() helper
│   │   └── hooks.ts           # Shared client hooks
│   └── styles/index.css
├── convex/
│   ├── schema.ts              # defineSchema (tables + types)
│   ├── contacts.ts            # query/mutation handlers
│   └── _generated/            # convex codegen (do not edit)
├── vite.config.ts             # tanstackStart + cloudflare + vite-plus tasks
├── wrangler.jsonc             # CF Worker config; main = TSS server entry
├── worker-configuration.d.ts  # Generated by `wrangler types`
├── tsconfig.json
└── package.json               # `imports`: #/* and #convex/*
```

### Path aliases

Use Node import aliases declared in `package.json`:

```json
"imports": {
    "#/*": "./app/*",
    "#convex/*": "./convex/*"
}
```

Then:

```ts
import { api } from "#convex/_generated/api.js";
import { getContactQuery } from "#/data/queries.ts";
```

Prefer `#/...` over deep relative imports (`../../..`). Use `.ts`/`.tsx`
extensions in imports — the lint config enforces this (`import/extensions`).

### Virtual file routes

Routes are declared in `app/routes.ts` and a route tree is generated to
`app/routes.gen.ts`. The generator is the TanStack Start Vite plugin; route
files only need to live wherever `routes.ts` points.

```ts
// app/routes.ts
import { rootRoute, route, index } from "@tanstack/virtual-file-routes";

export let routes = rootRoute("root.tsx", [
    index("routes/empty.tsx"),
    route("contact/$id", "routes/show.tsx"),
    route("contact/$id/edit", "routes/edit.tsx"),
]);
```

Notes:

- The `routesDirectory: "."` in `vite.config.ts` plus `virtualRouteConfig: "app/routes.ts"`
  means we opt out of filename-based routing in favor of explicit config.
  This makes route → file mapping explicit and refactor-friendly.
- `routes.gen.ts` is gitignored and rebuilt by the plugin. Never edit it.
- The `Register` module augmentation in `routes.gen.ts` declares `ssr: true`
  for `@tanstack/react-start`, which is how server functions know they run in
  an SSR environment.

---

## 3. The router: context, loaders, components

`router.tsx` is the single composition root. It is called by TanStack Start on
both the server (once per request) and the client (once per page load).

```ts
// app/router.tsx
export function getRouter() {
    let { convex, queryClient } = createConvexQueryClient();

    function Wrap({ children }: PropsWithChildren) {
        return (
            <ConvexProvider client={convex}>
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </ConvexProvider>
        );
    }

    let router = createRouter({
        routeTree,
        scrollRestoration: true,
        defaultPreload: "intent",
        context: { queryClient },
        Wrap,
    });

    setupRouterSsrQueryIntegration({ router, queryClient });

    return router;
}
```

Key decisions:

- **A fresh `QueryClient` per `getRouter()` call.** On the server this means
  per-request isolation (no cache bleed between users). On the client it means
  one client for the lifetime of the page. _Never_ hoist the QueryClient to
  module scope.
- **Same `Wrap` runs in both environments.** Both providers wrap every render
  so hooks like `useMutation` from `convex/react` and `useSuspenseQuery` from
  React Query always have a context.
- **`context: { queryClient }` exposes the client to loaders** so they can call
  `queryClient.ensureQueryData(...)` without importing a singleton.
- **`setupRouterSsrQueryIntegration`** is the magic glue: it serializes the
  React Query cache into the HTML on the server and rehydrates it in the
  browser. Without it, every `useSuspenseQuery` in a loader-prefetched route
  would re-fetch on the client.
- **`defaultPreload: "intent"`** kicks loaders on link hover/focus.
- **`scrollRestoration: true`** restores scroll on back/forward.

The root must be created via `createRootRouteWithContext` so the context type
propagates through the tree:

```ts
// app/root.tsx
export let Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    /* ... */
});
```

### Loader pattern

The canonical route loader uses `queryClient.ensureQueryData` with a query
options object exported from `app/data/queries.ts`:

```ts
// app/routes/show.tsx
export let Route = createFileRoute("/contact/$id")({
    async loader({ context: { queryClient }, params }) {
        let contact = await queryClient.ensureQueryData(getContactQuery(params.id));
        if (!contact) throw notFound();
    },
    component: ShowContact,
});

function ShowContact() {
    let params = Route.useParams();
    let { data: contact } = useSuspenseQuery(getContactQuery(params.id));
    /* ... */
}
```

Why this is the canonical shape:

- **The loader populates the cache; the component reads from it.** The
  component does not receive data via props from the loader (TanStack Router
  _can_ do that, but it bypasses React Query and loses the realtime channel).
  Both use the same query options builder, so the cache key is guaranteed
  identical.
- **`ensureQueryData` is the SSR-safe call.** It returns the existing value if
  already cached, otherwise fetches and caches. During SSR it produces the
  promise that `setupRouterSsrQueryIntegration` serializes into the HTML.
- **`useSuspenseQuery` in the component** is what lets `@convex-dev/react-query`
  swap the HTTP-fetched value for a live WebSocket subscription on the client
  once mounted. Combined with hydration this means: server renders the
  contact, browser receives the HTML _and_ a live subscription pointed at the
  same query.
- **`throw notFound()`** from the loader if the row doesn't exist. The router
  renders the closest `notFoundComponent`. Re-check in the component too,
  because realtime updates can delete the row out from under you while the
  page is open.

### Search params with validation

Validate search params at the route boundary. Use schema, not ad-hoc parsing:

```ts
// app/root.tsx
export let Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    validateSearch: fromSearch<{ q?: string }>()(QuerySchema),
    loaderDeps: ({ search: { q } }) => ({ q }),
    loader: ({ context: { queryClient }, deps: { q } }) =>
        queryClient.ensureQueryData(listContactsQuery(q)),
    component: Root,
});
```

- `validateSearch` runs on every navigation; output is typed.
- `loaderDeps` declares which slice of search params triggers a loader re-run.
  Without it the loader would re-run on every search change.
- The component reads `Route.useLoaderDeps()` (or `Route.useSearch()`) instead
  of parsing `window.location`.

### Edit-route reload behavior

The edit route uses the verbose loader form to tune reload semantics:

```ts
loader: {
    handler: async ({ context: { queryClient }, params }) => { /* ... */ },
    staleReloadMode: "blocking",
},
```

`staleReloadMode: "blocking"` waits for fresh data before swapping in the
edit screen, so a stale value never flashes into form defaults. The show
route doesn't need this because the live subscription updates the rendered
contact in place.

---

## 4. The data layer: Convex through React Query

The clever bit of this stack is that **all reads go through React Query, but
the actual transport on the client is a Convex WebSocket subscription**. You
write code that _looks_ like React Query, and Convex makes it live.

### Two clients, two transports

```ts
// app/data/convex.ts
export function createConvexQueryClient() {
    let convex = new ConvexReactClient(VITE_CONVEX_URL);
    let convexQueryClient = new ConvexQueryClient(convex);

    let queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                queryKeyHashFn: convexQueryClient.hashFn(),
                queryFn: convexQueryClient.queryFn(),
                experimental_prefetchInRender: true,
            },
        },
    });

    convexQueryClient.connect(queryClient);
    return { convex, queryClient, convexQueryClient };
}

export function createConvexHttpClient() {
    return new ConvexHttpClient(VITE_CONVEX_URL);
}
```

- **`ConvexReactClient` + `ConvexQueryClient`** — used in the route/component
  layer. The query client uses Convex's `hashFn` and `queryFn` as defaults, so
  any `convexQuery({api fn}, args)` works without per-call setup. On the
  client this client maintains a WebSocket; reads stay live.
- **`ConvexHttpClient`** — used in server functions. A Worker handler is a
  one-shot HTTP request; opening a WebSocket inside it would be wasteful and
  wrong. Mutations and ad-hoc reads from server functions go over HTTP.

Rule: **Inside a server function or any module that runs only on the server,
use `createConvexHttpClient()`. Inside a React component or any code that
might run on the client, use the React Query options pattern.**

### Query options builders

```ts
// app/data/queries.ts
import { convexQuery } from "@convex-dev/react-query";
import { api } from "#convex/_generated/api.js";

export function getContactQuery(id: string) {
    return convexQuery(api.contacts.get, { id: id as Id<"contacts"> });
}

export function listContactsQuery(q?: string) {
    return convexQuery(api.contacts.list, { q });
}
```

- One builder per Convex query. Export from `app/data/queries.ts`. _Never_
  inline `convexQuery(...)` calls in components — the loader and the
  component must produce the _same_ options object so the query key matches.
- `api.contacts.list` is the type-safe reference to a Convex function. The
  generated types in `convex/_generated/api.d.ts` make `args` and return value
  fully typed end-to-end.

### Convex functions

```ts
// convex/contacts.ts
export let list = query({
    args: { q: v.optional(v.string()) },
    handler: async (ctx, { q }) => {
        let rows = await ctx.db.query("contacts").collect();
        if (q) rows = matchSorter(rows, q, { keys: ["first", "last"] });
        return sortBy(rows, ["last", "_creationTime"]);
    },
});
```

- `args` is a Convex validator (not Valibot). It governs the wire format
  and gives the codegen its types.
- Use `v.id("contacts")` for typed document IDs. Server functions on the start
  side typecast `string` → `Id<"contacts">`; Convex validates at the boundary.
- Reactive subscriptions are automatic — every `useQuery`/`useSuspenseQuery`
  through `@convex-dev/react-query` is a live subscription.

### Schema

```ts
// convex/schema.ts
export default defineSchema({
    contacts: defineTable({
        first: v.string(),
        last: v.string(),
        avatar: v.optional(v.string()),
        bsky: v.string(),
        notes: v.string(),
        favorite: v.boolean(),
    }),
});
```

The schema is the source of truth for stored shape. `Doc<"contacts">` and
`Id<"contacts">` are derived in `convex/_generated/dataModel.d.ts`. Import
those types into the React code — do not redeclare them.

---

## 5. Mutations: server functions vs Convex mutations

There are **two valid ways to mutate data** in this stack, and choosing
between them is the single most important architectural decision per
feature.

|                    | Server function (`createServerFn`)           | Convex mutation (`useMutation`)     |
| ------------------ | -------------------------------------------- | ----------------------------------- |
| Runs in            | Cloudflare Worker                            | Browser (sends RPC to Convex)       |
| Endpoint URL       | `serverFn.url` (Worker route)                | None (Convex client)                |
| Input              | `FormData` or JSON, validated by Valibot     | Typed args, validated by Convex `v` |
| Works without JS   | Yes (HTML form posts)                        | No                                  |
| Redirect support   | Yes (`throw redirect(...)`)                  | No                                  |
| Optimistic updates | Manual                                       | Built in (`.withOptimisticUpdate`)  |
| Reads              | Via `ConvexHttpClient`                       | N/A                                 |

**Heuristic:**

- **Default to a server function.** It gives you a stable URL for
  `<form action>`, redirects, and a no-JS path by default. The
  prime directive (§ 0) makes this the path of least resistance.
- **Layer a direct Convex `useMutation` on top _only_ when you need
  optimistic UI** the user will notice on slow networks. Even then,
  keep the form's `action` pointing at a server function so the
  non-JS path still works. The favorite toggle in
  [`FavoriteButton`](app/components/buttons.tsx) is the canonical
  example: `<form action={toggleFavorite.url}>` for correctness, plus
  a Convex `useMutation().withOptimisticUpdate(...)` invoked from
  `onSubmit` for the snappy UX.

This app does both. See **§ 6** for examples.

### Server function shape

```ts
// app/data/mutations.ts
export let destroyContact = createServerFn({ method: "POST" })
    .inputValidator(fromInput<FormData>()(IdSchema))
    .handler(async ({ data }) => {
        let convex = createConvexHttpClient();
        await convex.mutation(api.contacts.destroy, { id: data.id as Id<"contacts"> });
        throw redirect({ to: "/" });
    });
```

Conventions:

- Declare method explicitly (`POST`). The form `action` and `method` come
  from `serverFn.url` / `serverFn.method` (see § 6).
- Validate input with Valibot; `fromInput<FormData>()(Schema)` lets the
  validator parse a `FormData` object directly via
  `@conform-to/valibot`'s `parseWithValibot`.
- Throw `redirect(...)` instead of returning a Response. TanStack Start
  unwinds it correctly on both the JS and non-JS code paths.
- Throw `notFound()` for 404s. Same reasoning.
- Open a fresh `ConvexHttpClient` per call. Cheap, and avoids hidden state.
- Cast string IDs to `Id<"contacts">` at the Convex boundary. Convex
  re-validates so the cast is safe.

### Convex mutation with optimistic update

```ts
// app/components/buttons.tsx — FavoriteButton
let toggle = useMutation(api.contacts.update).withOptimisticUpdate((localStore, args) => {
    let favorite = args.favorite;
    if (favorite === undefined) return;
    let contact = localStore.getQuery(api.contacts.get, { id: args.id });
    if (contact) {
        localStore.setQuery(api.contacts.get, { id: args.id }, { ...contact, favorite });
    }
});
```

`localStore` is Convex's local query cache (separate from React Query's). The
optimistic value applies until the mutation acks, after which the
subscription pushes the canonical value. There is no manual rollback.

---

## 6. Forms: progressive enhancement done right

Re-read **§ 0** if you haven't. This section is the concrete implementation
of that prime directive.

The pattern: **every interactive element is a `<form>` whose `action` is a
server-function URL.** JS, when present, intercepts `onSubmit` and routes
through `useServerFn(...)`. JS, when absent, the browser submits natively
and the Worker handles the request identically. There is no second
mutation code path.

```tsx
// app/components/buttons.tsx — DeleteButton
export function DeleteButton(props: ComponentProps<"form"> & { id: string }) {
    let destroy = useServerFn(destroyContact);
    return (
        <form
            action={destroyContact.url}
            method={destroyContact.method}
            onSubmit={async event => {
                event.preventDefault();
                if (!confirm("Please confirm you want to delete this record.")) return;
                await destroy({ data: new FormData(event.currentTarget) });
            }}
            {...props}
        >
            <input name="id" type="hidden" value={props.id} />
            <button type="submit">Delete</button>
        </form>
    );
}
```

Why it's shaped this way:

- **`action={serverFn.url}` + `method={serverFn.method}`** mean the form
  works _without JavaScript_. The Worker handles the POST natively, the
  server function redirects, and the browser follows. End to end, no JS
  involved.
- **`useServerFn(destroyContact)`** gives a callable that JS-enhances the
  submit. After `preventDefault()` we hand the raw `FormData` to the same
  handler. Same validator, same code path, same redirect — but no full page
  reload, no scroll reset, and any optimistic UI applies.
- **Hidden inputs carry IDs.** This is the universal pattern — works with
  `FormData` whether the request is JS or HTML. Never read IDs from
  closures; serialize them into the form so the no-JS path has them too.
- **Confirm dialogs and other UX wrap the JS path** but the no-JS fallback
  still works (it just won't ask). That's an acceptable degradation.
- **No `onClick` action buttons.** A click handler on a bare `<button>`
  is dead without JS. Every action button in this app is a `<form>` with
  a submit button inside. `<button type="submit">` is the affordance;
  the form is the action.

Likewise for navigations triggered by buttons (e.g., the "Edit" button in
[`EditButton`](app/components/buttons.tsx)):

```tsx
let options = linkOptions({ to: "/contact/$id/edit", params: { id: props.id } });
let editHref = useHref(options);
return (
    <form
        action={editHref}
        method="get"
        onSubmit={async event => {
            event.preventDefault();
            await navigate(options);
        }}
    >
        <button type="submit">Edit</button>
    </form>
);
```

The form is a _GET_ form — without JS the browser navigates by appending
the form data to the URL (here, none). With JS, `navigate()` does a
client-side transition. Same destination either way. The same
`linkOptions` are reused for both `useHref` (the no-JS `action`) and
`navigate` (the JS path), so there is one typed source of truth.

### Edit form

The edit form uses the same pattern (`EditContactForm` wraps the
`updateContact` server fn). Defaults come from the loader-cached contact via
`useSuspenseQuery`. Fields are uncontrolled (`defaultValue`) — the form is
submitted via `new FormData(event.currentTarget)` so React doesn't need to
own the values.

### Search form: a different beast

`SearchForm` does _not_ post; it updates the URL query string. Three
patterns worth copying:

1. **Local state for the input, URL for the source of truth.** Router
   transitions wrap navigations, so `Route.useSearch()` lags the keystroke.
   A controlled input bound to URL state would visually reset between
   keystrokes. Fix: hold an immediate local `value`, sync from URL on
   external navigation only.
2. **Adjust state during render** (`if (query !== syncedQuery) { setSyncedQuery(query); setValue(query ?? ""); }`)
   instead of `useEffect`. This is React's officially-blessed pattern for
   syncing derived state. See
   https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
3. **Push vs replace.** First keystroke pushes a history entry; subsequent
   keystrokes replace. The `liveRef` is necessary because `value` lags
   inside a single render burst — without it, the push/replace decision
   would be wrong on rapid typing.

### `useNavigating()` for transition UI

```ts
// app/lib/hooks.ts
export function useNavigating(): boolean {
    let { isLoading, location, resolvedLocation } = useRouterState();
    return isLoading && location.pathname !== resolvedLocation?.pathname;
}
```

True only when the _pathname_ is changing (not just search params). Use it
to fade content during route transitions without flickering on every
keystroke in the search box. See `Details`, `SidebarItem`, `SearchForm`.

### `useHref()` helper

```ts
// app/lib/href.ts
export function useHref<const TOptions>(
    options: ValidateLinkOptions<RegisteredRouter, TOptions, string, "a">,
): string {
    let router = useRouter();
    return router.buildLocation(options as ToOptions).href;
}
```

Lets you produce a typed href string for use in `<form action>` or `<a href>`
where you can't use `<Link>`. Pair with `linkOptions({...})` to keep one
typed source of route options and reuse it in `navigate()` calls.

---

## 7. SSR + hydration: what actually happens

A request to `/contact/abc123`:

1. Cloudflare Worker invokes TanStack Start's server entry (configured via
   `wrangler.jsonc`'s `"main": "@tanstack/react-start/server-entry"`).
2. Start calls `getRouter()`. A fresh `QueryClient` + `ConvexReactClient`
   are constructed.
3. Router matches `/contact/$id`. Loaders run:
    - Root loader: `ensureQueryData(listContactsQuery(q))` — populates the
      contacts list.
    - Show route loader: `ensureQueryData(getContactQuery("abc123"))` — fetches
      the one contact.
    - These hit Convex over the React Query `queryFn` (which is Convex's
      under the hood). On the server it uses HTTP under the covers.
4. React renders the route tree to HTML. `useSuspenseQuery` finds cached
   values from step 3, so no suspending occurs.
5. `setupRouterSsrQueryIntegration` dehydrates the QueryClient and inlines
   the cache into the HTML.
6. Worker streams the HTML to the browser.
7. Browser hydrates. `getRouter()` runs again — fresh `QueryClient` —
   `setupRouterSsrQueryIntegration` rehydrates from the inlined cache.
8. `ConvexReactClient` connects via WebSocket. Each active
   `useSuspenseQuery` becomes a live subscription. Mutations on any
   connected client push deltas into the open subscriptions.

Implications:

- The initial page is fully rendered HTML. No client-side loading flash.
- After hydration the page is _live_. Edit a contact in another tab and the
  open tab updates without a refresh.
- If you bypass the loader (e.g. `useQuery` with a key the loader didn't
  prime), you'll get a client-side fetch and a loading state.

---

## 7a. Per-component document metadata (React 19)

React 19 hoists `<title>`, `<meta>`, `<link>`, `<script>`, and `<style>`
tags that are rendered anywhere in the component tree up into the
document `<head>` automatically — on both the server (so the streamed
HTML contains them) and the client (so navigations update them).

**Use this. It removes the need for a Helmet-style API.**

Concrete patterns used in this archetype:

- **Per-route titles** — render `<title>` inside the route component.
  See [`ShowContact`](app/routes/show.tsx):

    ```tsx
    function ShowContact() {
        let { data: contact } = useSuspenseQuery(getContactQuery(params.id));
        return (
            <div id="contact">
                <title>{`${contact.first} ${contact.last} | TanStack Contacts`}</title>
                {/* ...rest of the page */}
            </div>
        );
    }
    ```

    The `<title>` lives next to the data that produces it. React lifts it
    to `<head>` automatically. SSR includes it in the initial HTML; SPA
    navigations swap it.

- **Stylesheets, favicons, and other `<link>` tags** — render them
  wherever they belong semantically (typically the root). See
  [`Root`](app/root.tsx):

    ```tsx
    <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link href={styles} rel="stylesheet" />
        <link href="/favicon.ico" rel="icon" type="image/x-icon" />
        <title>TanStack Contacts</title>
    </head>
    ```

    The root happens to render them directly inside `<head>` because it
    owns the document shell. But a _route_ could equally render a
    `<link rel="preload">` for an above-the-fold image and React would
    hoist it.

- **Per-page meta (OpenGraph, descriptions, canonical)** — same
  pattern: render `<meta>` and `<link rel="canonical">` inside the
  route component that owns that page. They will appear in the SSR
  HTML and update on navigation.

- **Page-scoped `<style>` and `<script>` tags** — when a third-party
  embed (analytics script, structured-data JSON-LD) belongs to a
  specific route, render it inside that route. React handles dedup
  by `href`/`src`.

Rules of thumb:

- **Render at the deepest sensible component** — the one that owns
  the data the tag depends on. Don't centralize titles in the root and
  pass strings down; let routes own their own `<title>`.
- **Default titles in the root, specific titles in routes.** The root
  renders a generic `<title>TanStack Contacts</title>`; a child route
  rendering `<title>...</title>` wins. React keeps the last-rendered
  one.
- **For meta tags that should aggregate (e.g. multiple OG tags),
  render them all** — React will hoist each.
- **No portals, no Helmet-style providers, no `useEffect` setting
  `document.title`.** If you see those, replace them.

Caveat: nested `<title>` tags inside the _body_ are valid for React's
hoisting but invalid HTML if they were to stay there. Don't worry —
React removes them from the original position when it hoists. The
mental model is "declare what you want in `<head>` from anywhere".

---

## 8. Environment + configuration

### Validate env at the boundary

```ts
// app/lib/schemas.ts
import * as v from "valibot";
import { assert } from "@std/assert";

let EnvSchema = v.object({
    DEV: v.boolean(),
    SSR: v.boolean(),
    VITE_CONVEX_URL: v.pipe(v.string(), v.url()),
});

export function parseEnv(env: Record<string, unknown>) {
    let parsed = v.safeParse(EnvSchema, env);
    /* ... */
    assert(value, `\n\nMust provide the following environment variables:\n${issues.join("\n")}\n`);
    return value;
}
```

Pass `import.meta.env` in. Crashes loudly at startup if anything is missing.
**Every module that reads an env var should go through `parseEnv`.**

### Vite-exposed vs Worker-bound

- `VITE_*` env vars are inlined at build time and available to browser code.
- Non-`VITE_*` vars in `wrangler.jsonc` are runtime bindings on the Worker
  only. Read them through the Worker request context, not `import.meta.env`.
- `.env.local` is for local dev; it is gitignored.

### Cloudflare worker config

```jsonc
// wrangler.jsonc
{
    "name": "tanstack-react-start-contacts",
    "compatibility_date": "2026-05-17",
    "compatibility_flags": ["nodejs_compat"],
    "main": "@tanstack/react-start/server-entry",
}
```

- `main` points at the TanStack Start server entry export, _not_ a local
  file. The Vite + cloudflare plugins compose to produce a Worker bundle
  that runs through this entry.
- `nodejs_compat` is required for some Convex client internals.
- Run `vpr typegen:cloudflare` (alias for `wrangler types`) to regenerate
  `worker-configuration.d.ts` whenever you add a binding.

### Vite plugin order

```ts
plugins: [
    devtoolsJson(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({
        srcDirectory: "app",
        router: {
            routesDirectory: ".",
            virtualRouteConfig: "app/routes.ts",
            generatedRouteTree: "routes.gen.ts",
        },
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
],
```

- `cloudflare` first sets up the Worker SSR environment named `"ssr"`. The
  TanStack Start plugin then targets that environment.
- `react()` after `tanstackStart` so JSX is transformed correctly.
- `babel` with the React Compiler preset enables auto-memoization. Keep
  components straightforward; trust the compiler.
- `tailwindcss()` is the Tailwind v4 Vite plugin — it scans templates and
  emits the utility CSS that `app/styles/index.css` imports via
  `@import "tailwindcss"`. CSS is processed through `lightningcss`
  (`css.transformer: "lightningcss"` in the Vite config).

### Styling: Tailwind v4 with `@theme` tokens

[`app/styles/index.css`](app/styles/index.css) is the single CSS entry point.
It uses Tailwind v4's CSS-first config:

```css
@import "tailwindcss";

@theme {
    --color-foreground: #121212;
    --color-bsky: #3992ff;
    --color-favorite: #eeb004;
    /* ...design tokens... */
}

@layer base {
    body { color: var(--color-foreground); /* ... */ }
    button { /* ... */ }
}

@utility search-icon { background-image: url("data:image/svg+xml,..."); }
@utility spinner-icon { background-image: url("data:image/svg+xml,..."); }
```

Conventions:

- **Design tokens live in `@theme`.** Tailwind exposes each as a CSS
  variable _and_ a generated utility (`--color-favorite` →
  `text-favorite`, `bg-favorite`). Components reference tokens via
  utilities, never raw hex values.
- **Component-local utilities, not BEM-style classes.** Every JSX
  element styles itself inline (`className="flex h-full w-full"`). No
  `.contact-list { ... }` rules in CSS.
- **`@utility` for shared one-off backgrounds** (inline SVG icons,
  patterns) so they're still composable with state variants like
  `hover:` or `data-[…]:`.
- **The CSS file imports Tailwind once, at the top.** Don't fragment
  styles into per-component CSS files — utilities go in JSX.

---

## 9. Dev workflow

`vite-plus` is used as a task runner. Commands:

- `vpr dev` — runs `dev:convex` and `dev:vite` in parallel after a
  `db:reset` that wipes `.convex/`. Convex auto-seeds the schema and the
  app reseeds via `app/data/seed.ts` on first server boot.
- `vpr build` — production build.
- `vpr preview` — locally serve the built Worker.
- `vpr typecheck` — runs codegen (`typegen:cloudflare` → `wrangler types`,
  `typegen:convex` → `convex codegen --typecheck disable`) then
  `tsgo --noEmit`. Always green this before pushing.
- `vpr check` — `fmt` + `lint --fix` + `typecheck`. The single quality
  gate to run before committing. Lint is type-aware
  (`typeAware: true, typeCheck: true`) and pulls in
  `eslint-plugin-perfectionist` and `eslint-plugin-prefer-let`.

Per `CLAUDE.md`: do **not** start the dev server from an agent context. The
human likely has it running already; ask them to start one if needed.

### Dev-only seeding

```ts
// app/router.tsx
const { DEV, SSR } = parseEnv(import.meta.env);
if (DEV && SSR) {
    let { seedDatabase } = await import("./data/seed.ts");
    await seedDatabase();
}
```

Imported dynamically inside a `DEV && SSR` gate so the seeding code is
tree-shaken from the production bundle. `seed.ts` is idempotent — it inserts
only if the table is empty.

### Codegen artifacts

These files are generated and gitignored or excluded from review:

- `app/routes.gen.ts` — route tree.
- `convex/_generated/**` — Convex API + dataModel types.
- `worker-configuration.d.ts` — Cloudflare bindings types.

Never edit them. If something is wrong, fix the upstream config and
re-run codegen.

---

## 10. Conventions & gotchas

These mirror `CLAUDE.md` but with reasoning. When in doubt, follow these.

### Style

- **`let`, not `const`**, for everything that isn't a true module-scope
  constant. Top-level constants use `SCREAMING_SNAKE_CASE`. Lint
  (`prefer-let/prefer-let`) enforces.
- **One declaration per `let`.**
- **`.ts`/`.tsx` extensions in imports** — `import/extensions` enforces.
- **`import type` for type-only imports** — `verbatimModuleSyntax: true`
  in `tsconfig.json` makes this an error otherwise.
- **`node:` protocol** for Node built-ins on the rare occasion you reach
  for one (the Worker uses `nodejs_compat` shims).
- **Self-close empty JSX elements**.
- **Sorted JSX props** (perfectionist) — accept the lint suggestion.

### Types

- **No `any`.** Use `unknown` if the type is genuinely unknown.
- **No `as` typecasts** except at validated boundaries (e.g. casting
  `string` → `Id<"contacts">` _immediately_ before handing to Convex,
  which revalidates).
- **No non-null assertions (`!`).** Reach for `assert()` from
  `@std/assert` or a discriminated union instead.
- **Infer types whenever possible.** Don't over-annotate function args
  or return types if the inference is correct.

### Cookies + storage

- **Do not touch `document.cookie`.** Use TanStack Start's cookie
  utilities from `@tanstack/react-start/server`.

### Code organization

- **Components do not call `convexQuery` directly.** They import a
  builder from `#/data/queries.ts`. This is what guarantees loader/
  component query-key parity.
- **Server functions live in `#/data/mutations.ts`.** UI components
  import them as values to grab `.url`/`.method` and wrap with
  `useServerFn`.
- **No data fetching inside `app/components/`.** Components receive
  data via props or read from already-primed queries.

### Performance

- **Compile regexes at module scope**, never inside hot functions
  (e.g. `AT_PATTERN` in `convex/contacts.ts`).
- **`defaultPreload: "intent"`** is already on — links preload on
  hover. Don't add manual preloading on top of it.
- **Trust the React Compiler.** Avoid manual `useMemo`/`useCallback`
  unless profiling proves they're needed.

### Realtime gotchas

- Convex queries are subscriptions. A row that exists at loader time can
  be deleted before the component reads it. Re-check `if (!contact) throw
notFound();` inside components, not just loaders.
- Optimistic updates via `.withOptimisticUpdate` apply to Convex's local
  store. React Query's hydrated cache will reconcile when the WebSocket
  pushes the canonical update.

### Server-only vs universal

- Anything importing `@tanstack/react-start` server APIs (`createServerFn`,
  `ConvexHttpClient`) must only be reached from server-execution paths or
  through `useServerFn`. Don't import server-only modules eagerly into
  client-rendered components except to grab the `.url`/`.method`
  metadata — `useServerFn` is the safe wrapper for the callable.

### When adding a new feature

1. Add the table (or fields) to `convex/schema.ts`.
2. Add Convex `query`/`mutation` handlers under `convex/<entity>.ts`.
3. Add query-options builders in `app/data/queries.ts`.
4. Add server functions in `app/data/mutations.ts` if you need
   redirects or progressive enhancement; otherwise call the Convex
   mutation directly with `useMutation`.
5. Register the route in `app/routes.ts` and create the route file.
6. Wire the loader to `ensureQueryData(yourQuery(...))`.
7. Read in the component via `useSuspenseQuery(yourQuery(...))`.
8. Run `vpr check` before committing.

---

## 11. What this archetype intentionally does _not_ do

So you don't waste time looking for it:

- **No auth.** When you need it, reach for **Clerk** — it's the smoothest
  fit with this stack. Use `@clerk/tanstack-react-start` for the
  framework integration (it wires `<ClerkProvider>` around the router
  in `app/router.tsx` and exposes `getAuth()` for server functions),
  and use Clerk's official Convex integration to forward the user's
  JWT to Convex so `ctx.auth.getUserIdentity()` works inside queries
  and mutations. Wrap your `ConvexReactClient` with
  `ConvexProviderWithClerk` instead of the plain `ConvexProvider`,
  and gate server functions with `await getAuth(...)` before opening
  the `ConvexHttpClient` (forward the token so the Convex side can
  enforce auth at the function boundary, not just the UI).
- **No tests.** Add Vitest for unit tests, Playwright for e2e. The
  Convex CLI ships a `convex-test` harness for backend logic.
- **No error boundaries beyond defaults.** Add `errorComponent` to routes
  for production.
- **No internationalization, accessibility audit, or perf budgets.**

These are deliberately left out so the architecture is legible. Add them
incrementally; none of them require breaking these patterns.

---

## 12. Quick reference: where things live

| Need                                       | Location                                                 |
| ------------------------------------------ | -------------------------------------------------------- |
| Add/change a database table                | `convex/schema.ts`                                       |
| Add a Convex query/mutation                | `convex/<entity>.ts`                                     |
| Build a typed query options object         | `app/data/queries.ts`                                    |
| Add a server function (form post target)   | `app/data/mutations.ts`                                  |
| Create or rename a route                   | `app/routes.ts` + file under `app/routes/`               |
| Validate search params / form data / env   | `app/lib/schemas.ts` (Valibot + `@conform-to/valibot`)    |
| Add a design token or base style           | `app/styles/index.css` (`@theme`, `@layer base`)         |
| Compose providers around the router        | `app/router.tsx`                                         |
| Render `<html>`, layout, root data         | `app/root.tsx`                                           |
| Set page `<title>` / `<meta>` / `<link>`   | Render directly in the route component (React 19 hoists) |
| Configure Vite, vite-plus tasks, lint, fmt | `vite.config.ts`                                         |
| Configure the Worker                       | `wrangler.jsonc`                                         |
| Cloudflare binding types                   | `worker-configuration.d.ts` (generated)                  |

---

## 13. Reading list

- TanStack Start: https://tanstack.com/start/latest/docs/framework/react/overview
- TanStack Router loaders & search params: https://tanstack.com/router/latest/docs/framework/react/guide/data-loading
- `@tanstack/react-router-ssr-query`: https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading#ssr-with-tanstack-query
- `@convex-dev/react-query`: https://docs.convex.dev/quickstart/react
- Convex schema + validators: https://docs.convex.dev/database/schemas
- Cloudflare Vite plugin: https://developers.cloudflare.com/workers/vite-plugin/
- Valibot: https://valibot.dev — schema validation patterns used here.
- `@conform-to/valibot`: https://conform.guide/api/valibot — form-data
  parsing built on Valibot schemas.
- React "you might not need an effect": https://react.dev/learn/you-might-not-need-an-effect

When patterns above conflict with newer guidance from these sources,
**update this file** and the corresponding code together. Architecture
docs that drift from the codebase are worse than no docs.
