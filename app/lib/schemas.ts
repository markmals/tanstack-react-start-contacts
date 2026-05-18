import * as s from "@remix-run/data-schema";
import * as coerce from "@remix-run/data-schema/coerce";
import * as f from "@remix-run/data-schema/form-data";
import assert from "node:assert";

export let QuerySchema = f.object({
    q: f.field(s.union([s.string(), s.undefined_()])),
});

export let FavoriteSchema = f.object({
    id: f.field(coerce.number()),
    favorite: f.field(coerce.boolean()),
});

export let UpdateSchema = f.object({
    id: f.field(coerce.number()),
    first: f.field(s.defaulted(s.string(), "")),
    last: f.field(s.defaulted(s.string(), "")),
    avatar: f.field(s.union([s.string(), s.undefined_()])),
    bsky: f.field(s.defaulted(s.string(), "")),
    notes: f.field(s.defaulted(s.string(), "")),
});

export let IdSchema = f.object({ id: f.field(coerce.number()) });

export function fromInput<Input>() {
    return <Output>(schema: s.Schema<unknown, Output>) =>
        (input: Input) =>
            s.parse(schema, input);
}

let EnvSchema = s.object({
    DATABASE_URL: s.string(),
});

export function parseEnv() {
    let env = s.parseSafe(EnvSchema, process.env);
    let Path = s.optional(s.array(s.string()));
    let issues = !env.success
        ? env.issues.map(e => s.parse(Path, e.path)?.join(" ")).filter(Boolean)
        : [];
    let value = env.success ? env.value : null;

    assert(value, `\n\nMust provide the following environment variables:\n${issues.join("\n")}\n`);

    return value;
}
