import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
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
        tailwindcss(),
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
                dependsOn: ["dev:convex", "dev:vite"],
                command: "",
            },
            "dev:vite": {
                command: "vp dev",
            },
            "dev:convex": {
                dependsOn: ["db:reset"],
                command: "yes | convex dev",
                cache: false,
            },
            build: {
                command: "vp build",
            },
            preview: {
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
            "typegen:convex": {
                command: "convex codegen --typecheck disable",
            },
            typecheck: {
                dependsOn: ["typegen:cloudflare", "typegen:convex"],
                command: "tsgo --noEmit",
            },
            check: {
                dependsOn: ["fmt", "lint", "typecheck"],
                command: "echo 'All quality gates run'",
            },
            "db:reset": {
                command: "rm -rf .convex",
                cache: false,
            },
            // deploy: {
            //     dependsOn: ["deploy:cloudflare", "deploy:convex"],
            //     command: "Deployed! 🎉",
            // },
            // "deploy:cloudflare": {
            //     command: "wrangler deploy",
            //     cache: false,
            // },
            // "deploy:convex": {
            //     command: "convex deploy",
            //     cache: false,
            // },
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
