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
    // Sanity Studio build output — hundreds of minified framework files. Linting
    // them is pointless and, at this size, enough to crash the ESLint process.
    "dist/**",
  ]),
]);

export default eslintConfig;
