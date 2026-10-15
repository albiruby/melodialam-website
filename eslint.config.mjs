import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tool-generated codegraph/gitnexus indexes are not ours to lint.
    ".codegraph/**",
    ".gitnexus/**",
    "lib/catalogue.json",
    // Payload-generated artefacts.
    "payload-types.ts",
    "app/(payload)/admin/importMap.js",
    // Payload's migrate:create output; its up/down signatures are fixed.
    "migrations/**",
  ]),
]);

export default eslintConfig;
