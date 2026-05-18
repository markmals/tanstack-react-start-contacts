import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig } from "vite-plus";

export default defineConfig({
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
    ],
    server: {
        port: 1612,
    },
    css: {
        transformer: "lightningcss",
    },
    run: {
        tasks: {
            dev: {
                dependsOn: ["db:bootstrap"],
                command: "vp dev",
            },
            build: {
                command: "vp build",
            },
            preview: {
                dependsOn: ["db:migrations:apply:local"],
                command: "vp preview",
            },
            fmt: {
                command: "vp fmt",
            },
            lint: {
                command: "vp lint --fix",
            },
            "typegen:cloudflare": {
                command: "wrangler types",
            },
            typecheck: {
                dependsOn: ["typegen:cloudflare"],
                command: "tsgo --noEmit",
            },
            check: {
                dependsOn: ["fmt", "lint", "typecheck"],
                command: "All quality gates run",
            },
            "db:bootstrap": {
                dependsOn: ["db:reset", "db:migrations:generate"],
                command: "wrangler d1 migrations apply contacts --local",
            },
            "db:reset": {
                command: "rm -rf .wrangler/state/v3/d1",
            },
            "db:migrations:generate": {
                command: "drizzle-kit generate",
            },
            "db:migrations:apply:local": {
                dependsOn: ["db:migrations:generate"],
                command: "wrangler d1 migrations apply contacts --local",
            },
            // "db:migrations:apply:remote": {
            //     command: "wrangler d1 migrations apply contacts --remote",
            //     cache: false,
            // },
            // "db:migrations:deploy": {
            //     dependsOn: ["db:migrations:generate"],
            //     command: "wrangler d1 migrations apply contacts --remote",
            //     cache: false,
            // },
            // deploy: {
            //     command: "wrangler deploy",
            //     cache: false,
            // }
        },
    },
    fmt: {
        ignorePatterns: ["**/worker-configuration.d.ts", "dist/**"],
        printWidth: 100,
        tabWidth: 4,
        arrowParens: "avoid",
        sortPackageJson: true,
        sortImports: {
            groups: [
                "type-import",
                ["value-builtin", "value-external"],
                "type-internal",
                "value-internal",
                ["type-parent", "type-sibling", "type-index"],
                ["value-parent", "value-sibling", "value-index"],
                "unknown",
            ],
            partitionByComment: true,
        },
        overrides: [
            {
                files: ["**/*.jsonc"],
                options: {
                    trailingComma: "none",
                },
            },
            {
                files: ["**/.vscode/**"],
                options: {
                    trailingComma: "all",
                },
            },
        ],
    },
    lint: {
        ignorePatterns: ["**/worker-configuration.d.ts", "dist/**"],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        jsPlugins: ["eslint-plugin-perfectionist", "eslint-plugin-prefer-let"],
        rules: {
            "typescript/no-floating-promises": "allow",
            "typescript/unbound-method": "allow",
            "perfectionist/sort-jsx-props": "warn",
            "import/extensions": [
                "error",
                "ignorePackages",
                {
                    cjs: "always",
                    cts: "always",
                    js: "always",
                    jsx: "always",
                    mjs: "always",
                    mts: "always",
                    ts: "always",
                    tsx: "always",
                },
            ],
            "eslint/prefer-const": "off",
            "prefer-let/prefer-let": [2, { forceUpperCaseConst: true }],
        },
    },
});
