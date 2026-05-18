# Contributor Guidelines

## Debugging Approach

- Use `console.log` with clear prefixes during development
- **NEVER** attempt to run the dev server yourself; I almost always have the dev server running in my own terminal, just tell me to start it up if you don't see an active process
- If you need to do some debugging, add some `console.log` statements, tell me where I need to look for the `console.log` statements when I run the project myself (client, server, both, somewhere else, etc.), and then I will come back and paste the results of the `console.log` statements for you
- Utilize the "Chrome DevTools MCP" for checking the browser console and visuals via scripts and screenshots automatically as part of your agentic loop

## General Rules

- Use `vpx` (`vp exec`) for running packages, locally and remotely, instead of `npx` or `pnpm exec`/`pnpm dlx`
- Use `vpr` (`vp run`) for running the Vite+ tasks defined in `vite.config.ts`
- Run `vpr typecheck` (or `vpx tsgo --noEmit`) periodically to verify your work
- Run quality gates via `vpr check` before committing
- Periodically run `vpr check` and fix all info, warnings, and errors
- Use JSDoc/TSDoc comments for public APIs
- Document important lines of code with a single line comment
- Prefer `jsr:@std/*` for standard library
    - JSR packages can be installed using `vp add [-D] jsr:package-name`
- Use relative imports for local modules
- Prefer Node-native import aliases `#/*` over relative imports for local modules
- Validate environment variables at startup using `parseEnv()`
- **Remove anything that isn't used** – delete unused imports, function parameters, and private class members.
- **Use `any` as little as possible** – always prefer `unknown` if the type is unknown.
- **Don't typecast** – avoid typecasting using `as` whenever possible; prefer correct types at the source instead unless they're truly unknown.
- **Infer types as much as possible** – write and utilize APIs to use inferred types instead of needing to explicitly type arguments, variables, functions, etc; most types can be inferred, make sure they absolutely cannot and are not designed to be inferred before explicitly specifying types.
- **Hands off `document.cookie`** – manipulating cookies directly is forbidden. Use TanStack Start's cookie utilities (from `@tanstack/react-start/server`) instead.
- **Compile regexes once** – declare regular expressions at module scope, not inside hot functions.
- **Stick to ES modules** – no `require` or other CommonJS patterns.
- **Prefer `import type`** – separate type-only imports.
- **Use the `node:` protocol** – write `import fs from "node:fs"` rather than bare `"fs"`.
- **Arrays = `T[]`** – use shorthand array syntax consistently.
- **Favor `let`** – use `let` over `const` for bindings, unless declaring a truly top-level constant. Then declare it with an all caps binding as a `const`.
- **One `let` per line** – declare variables individually.
- **Skip non-null assertions** – rewrite code so `!` isn't necessary; consider using `@remix-run/data-schema` and/or `@remix-run/assert` where you might want to use `!`.
- **Avoid `enum`** – choose discriminated unions, objects, or literal types instead.
- **Stick with `trimStart/End`** – don't use `trimLeft/Right`.
- **Default parameters go last** – never precede required params with optional ones.
- **Self-close when empty** – use `<Component />` instead of `<Component></Component>` when there are no children.
- **No unused template literals** – convert to quotes if you're not interpolating.
- **Don't write `substr`** – use `slice` instead.
- **Flatten simple `if` chains** – collapse `else { if … }` when feasible.
- **Keep member access simple** – omit `public`, `private`, or `protected`. Use native JavaScript private properties (e.g. `#property`) when you need to make a property private.
- **Leverage `as const`** – assert immutability where appropriate.
- **Remove useless `else` blocks** – when the `if` branch returns or throws, omit the `else`.
