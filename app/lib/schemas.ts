import { parseWithValibot } from "@conform-to/valibot";
import { assert } from "@std/assert";
import * as v from "valibot";

export let QuerySchema = v.object({
    q: v.optional(v.string()),
});

export let FavoriteSchema = v.object({
    id: v.string(),
    favorite: v.pipe(
        v.string(),
        v.transform(value => value === "true"),
    ),
});

export let UpdateSchema = v.object({
    id: v.string(),
    first: v.optional(v.string(), ""),
    last: v.optional(v.string(), ""),
    avatar: v.optional(v.string()),
    bsky: v.optional(v.string(), ""),
    notes: v.optional(v.string(), ""),
});

export let IdSchema = v.object({ id: v.string() });

export function fromInput<Input extends FormData = FormData>() {
    return <Schema extends v.GenericSchema>(schema: Schema) =>
        (input: Input): v.InferOutput<Schema> => {
            let submission = parseWithValibot(input, { schema });
            assert(submission.status === "success", "Invalid form submission");
            return submission.value;
        };
}

export function fromSearch<Result extends Record<string, unknown>>() {
    return (schema: v.GenericSchema<unknown, Result>) =>
        (search: Record<string, unknown>): Result =>
            v.parse(schema, search);
}

let EnvSchema = v.object({
    DEV: v.boolean(),
    SSR: v.boolean(),
    VITE_CONVEX_URL: v.pipe(v.string(), v.url()),
});

export function parseEnv(env: Record<string, unknown>) {
    let parsed = v.safeParse(EnvSchema, env);
    let issues = parsed.success
        ? []
        : parsed.issues.map(issue => issue.path?.map(p => String(p.key)).join(" ")).filter(Boolean);
    let value = parsed.success ? parsed.output : null;

    assert(value, `\n\nMust provide the following environment variables:\n${issues.join("\n")}\n`);

    return value;
}
