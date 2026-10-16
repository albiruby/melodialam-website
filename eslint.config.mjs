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
    // tsc output from `npm run seed:sanity`; normally removed by the script,
    // ignored here so an interrupted run cannot fail the next lint.
    ".seed-build/**",
  ]),
]);

export default eslintConfig;
